// Complete CJS mock for react-native — needed because RN 0.83+ uses ESM in jest files
const React = require('react')

const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style),
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
}

const View = ({ children, ...props }) => React.createElement('View', props, children)
const Text = ({ children, ...props }) => React.createElement('Text', props, children)
const TextInput = (props) => React.createElement('TextInput', props)
const TouchableOpacity = ({ children, onPress, ...props }) =>
  React.createElement('TouchableOpacity', { ...props, onClick: onPress }, children)
const ScrollView = ({ children, ...props }) => React.createElement('ScrollView', props, children)
const KeyboardAvoidingView = ({ children, ...props }) =>
  React.createElement('KeyboardAvoidingView', props, children)
const ActivityIndicator = (props) => React.createElement('ActivityIndicator', props)
const Alert = { alert: jest.fn() }
const Platform = { OS: 'ios', select: (obj) => obj.ios ?? obj.default }
const Dimensions = { get: jest.fn(() => ({ width: 375, height: 812 })) }
const Keyboard = { dismiss: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) }
const Animated = {
  Value: jest.fn(() => ({ setValue: jest.fn(), interpolate: jest.fn() })),
  View: View,
  Text: Text,
  timing: jest.fn(() => ({ start: jest.fn() })),
  spring: jest.fn(() => ({ start: jest.fn() })),
  parallel: jest.fn(() => ({ start: jest.fn() })),
  sequence: jest.fn(() => ({ start: jest.fn() })),
}
const NativeModules = {}
const AppState = { currentState: 'active', addEventListener: jest.fn(() => ({ remove: jest.fn() })) }
const Linking = { openURL: jest.fn(), addEventListener: jest.fn(() => ({ remove: jest.fn() })) }
const Image = (props) => React.createElement('Image', props)
const FlatList = ({ data, renderItem, ...props }) =>
  React.createElement('FlatList', props, data?.map((item, i) => renderItem({ item, index: i })))
const SafeAreaView = ({ children, ...props }) => React.createElement('SafeAreaView', props, children)
const Modal = ({ children, ...props }) => React.createElement('Modal', props, children)
const Pressable = ({ children, onPress, ...props }) =>
  React.createElement('Pressable', { ...props, onClick: onPress }, children)

module.exports = {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  Keyboard,
  Animated,
  NativeModules,
  AppState,
  Linking,
  Image,
  FlatList,
  SafeAreaView,
  Modal,
  Pressable,
  useColorScheme: jest.fn(() => 'light'),
  useWindowDimensions: jest.fn(() => ({ width: 375, height: 812, scale: 2, fontScale: 1 })),
}
