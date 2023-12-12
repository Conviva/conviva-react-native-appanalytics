const t = require('babel-types');
const template = require('babel-template');

const convivaLibImport = template(`(
  require('@convivainc/conviva-react-native-appanalytics').default || {
    HIGHER_ORDER_COMP: (Component) => Component,
  }
)`);

const createHigherOrderComponent = template(`
  const COMPONENT_ID = HIGHER_ORDER_COMP_CALL_EXPRESSION;
`);

const ALLOWED_TOUCHABLE_COMPONENTS = [
  'TouchableOpacity',
  'TouchableNativeFeedback',
  'TouchableWithoutFeedback',
  'TouchableHighlight',
];

const replaceWithTouchableAutoTrackHigherOrderComponent = path => {
  
  if (!ALLOWED_TOUCHABLE_COMPONENTS.includes(path.node.id.name)) {
    return;
  }
  // console.log("replaceWithTouchableAutoTrackHigherOrderComponent++");

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

  // console.log("replaceWithTouchableAutoTrackHigherOrderComponent--");
};

function transform(babel) {
  return {
    visitor: {
      ClassDeclaration(path) {
        replaceWithTouchableAutoTrackHigherOrderComponent(path);
      },
    },
  };
}

module.exports = transform;
