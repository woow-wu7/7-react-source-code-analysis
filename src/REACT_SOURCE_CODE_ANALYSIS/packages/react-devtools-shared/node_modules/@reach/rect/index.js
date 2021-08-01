"use strict";

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.useRect = useRect;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _componentComponent = require("@reach/component-component");

var _componentComponent2 = _interopRequireDefault(_componentComponent);

var _observeRect = require("@reach/observe-rect");

var _observeRect2 = _interopRequireDefault(_observeRect);

var _propTypes = require("prop-types");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var render = function render(_ref) {
  var refs = _ref.refs,
      children = _ref.props.children,
      rect = _ref.state.rect;
  return children({ ref: function ref(node) {
      return refs.node = node;
    }, rect: rect });
};

var didMount = function didMount(_ref2) {
  var setState = _ref2.setState,
      refs = _ref2.refs,
      props = _ref2.props;

  if (!refs.node) {
    console.warn("You need to place the ref");
    return;
  }
  refs.observer = (0, _observeRect2.default)(refs.node, function (rect) {
    props.onChange && props.onChange(rect);
    setState({ rect: rect });
  });
  if (props.observe) {
    refs.observer.observe();
  }
};

var didUpdate = function didUpdate(_ref3) {
  var refs = _ref3.refs,
      props = _ref3.props,
      prevProps = _ref3.prevProps;

  if (props.observe && !prevProps.observe) {
    refs.observer.observe();
  } else if (!props.observe && prevProps.observe) {
    refs.observer.unobserve();
  }
};

var willUnmount = function willUnmount(_ref4) {
  var refs = _ref4.refs;

  refs.observer.unobserve();
};

var Rect = function Rect(props) {
  return _react2.default.createElement(_componentComponent2.default, _extends({}, props, {
    refs: {
      node: undefined,
      observer: undefined
    },
    initialState: {
      rect: undefined
    },
    didMount: didMount,
    didUpdate: didUpdate,
    willUnmount: willUnmount,
    render: render
  }));
};

process.env.NODE_ENV !== "production" ? Rect.propTypes = {
  children: _propTypes.func,
  observe: _propTypes.bool,
  onChange: _propTypes.func
} : void 0;

Rect.defaultProps = {
  observe: true
};

function useRect(nodeRef) {
  var observe = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  var _useState = (0, _react.useState)(null),
      rect = _useState[0],
      setRect = _useState[1];

  var observerRef = (0, _react.useRef)(null);
  (0, _react.useLayoutEffect)(function () {
    if (!observerRef.current) {
      observerRef.current = (0, _observeRect2.default)(nodeRef.current, setRect);
    }
    if (observe) {
      observerRef.current.observe();
    }
    return function () {
      return observerRef.current.unobserve();
    };
  }, [observe]);
  return rect;
}

exports.default = Rect;