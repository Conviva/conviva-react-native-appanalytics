require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "RNConvivaAppAnalytics"
  s.version      = package['version']
  s.license      = package['license']

  s.summary      = "Conviva React Native App Analytics"
  s.description  = package['description']
  s.homepage     = package['homepage']
  s.author       = { "Conviva Pvt Ltd" => "info@conviva.com" }

  s.platforms    = { :ios => "9.0", :tvos => "9.0" }

  s.source       = { :git => "https://github.com/Conviva-Internal/conviva-react-native-tracker.git", :tag => "#{s.version}" }
  s.source_files = "ios/**/*.{h,m}"

  s.requires_arc = true

  s.dependency "React-Core"
  s.dependency "ConvivaAppAnalytics", "1.5.0"
end
