'use strict';

// Resolve babel-types and babel-template in a version-agnostic way.
// Priority order:
//   1. Use types/template injected by Babel itself (Babel 7 plugin API).
//   2. Fall back to @babel/types / @babel/template (Babel 7 standalone packages).
//   3. Fall back to babel-types / babel-template (Babel 6 legacy packages,
//      guaranteed present via this package's own dependencies).
// The fallback chain means the plugin works whether the host project uses
// Babel 6 or Babel 7, without requiring either legacy package to be installed
// explicitly by the consuming app.

function resolveTypes(babel) {
  if (babel && babel.types) {
    return babel.types;
  }
  try { return require('@babel/types'); } catch (_) {}
  try { return require('babel-types'); } catch (_) {}
  throw new Error('[conviva] Could not resolve babel types. Install @babel/types (Babel 7) or babel-types (Babel 6).');
}

function resolveTemplate(babel) {
  if (babel && babel.template) {
    return babel.template;
  }
  try { return require('@babel/template').default || require('@babel/template'); } catch (_) {}
  try { return require('babel-template'); } catch (_) {}
  throw new Error('[conviva] Could not resolve babel template. Install @babel/template (Babel 7) or babel-template (Babel 6).');
}

const ALLOWED_TOUCHABLE_COMPONENTS = [
  'TouchableOpacity',
  'TouchableNativeFeedback',
  'TouchableWithoutFeedback',
  'TouchableHighlight',
];

function replaceWithTouchableAutoTrackHigherOrderComponent(path, t, template) {
  if (!ALLOWED_TOUCHABLE_COMPONENTS.includes(path.node.id.name)) {
    return;
  }

  const convivaLibImport = template(`(
    require('@convivainc/conviva-react-native-appanalytics').default || {
      HIGHER_ORDER_COMP: (Component) => Component,
    }
  )`);

  const createHigherOrderComponent = template(`
    const COMPONENT_ID = HIGHER_ORDER_COMP_CALL_EXPRESSION;
  `);

  const equivalentExpression = t.classExpression(
    path.node.id,
    path.node.superClass,
    path.node.body,
    path.node.decorators || []
  );

  const hocID = t.identifier('convivaTouchableAutoTrack');

  const convivaImport = convivaLibImport({
    HIGHER_ORDER_COMP: hocID,
  });

  const autotrackExpression = t.callExpression(
    t.memberExpression(convivaImport.expression, hocID),
    [equivalentExpression]
  );

  const replacement = createHigherOrderComponent({
    COMPONENT_ID: path.node.id,
    HIGHER_ORDER_COMP_CALL_EXPRESSION: autotrackExpression,
  });

  path.replaceWith(replacement);
}

// @babel/plugin-transform-react-display-name is listed in this package's
// dependencies, so it is always present in the package's own node_modules.
function resolveDisplayNamePlugin() {
  try {
    const mod = require('@babel/plugin-transform-react-display-name');
    return mod.default || mod;
  } catch (_) {}
  throw new Error(
    '[conviva] Could not resolve @babel/plugin-transform-react-display-name. ' +
    'Make sure it is installed: npm install --save-dev @babel/plugin-transform-react-display-name'
  );
}

// Injects `ClassName.displayName = 'ClassName'` after ES6 class declarations
// that contain a render() method. This covers the gap left by
// @babel/plugin-transform-react-display-name v7.x, which only handles
// React.createClass() / createReactClass() call patterns and has no
// ClassDeclaration visitor.
// Touchable components are skipped because they are replaced entirely by the
// HOC wrapping logic above.
function injectClassDisplayName(path, t) {
  const className = path.node.id && path.node.id.name;
  if (!className || ALLOWED_TOUCHABLE_COMPONENTS.includes(className)) return;

  const hasRenderMethod = path.node.body.body.some(
    member =>
      member.type === 'ClassMethod' &&
      member.key &&
      member.key.name === 'render'
  );
  if (!hasRenderMethod) return;

  path.insertAfter(
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(t.identifier(className), t.identifier('displayName')),
        t.stringLiteral(className)
      )
    )
  );
}

function transform(babel) {
  const t = resolveTypes(babel);
  const template = resolveTemplate(babel);

  return {
    // Bundles @babel/plugin-transform-react-display-name so consumers don't
    // need to add it separately - display name injection is a Conviva concern
    // required for screen_view auto-detection via ConvivaNavigationContainer.
    inherits: resolveDisplayNamePlugin(),
    visitor: {
      ClassDeclaration(path) {
        replaceWithTouchableAutoTrackHigherOrderComponent(path, t, template);
        injectClassDisplayName(path, t);
      },
    },
  };
}

module.exports = transform;
