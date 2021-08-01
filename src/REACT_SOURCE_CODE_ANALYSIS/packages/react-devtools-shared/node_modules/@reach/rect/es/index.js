var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import React, { useRef, useState, useLayoutEffect } from "react";
import Component from "@reach/component-component";
import observeRect from "@reach/observe-rect";
import { func, bool } from "prop-types";

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
  refs.observer = observeRect(refs.node, function (rect) {
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
  return React.createElement(Component, _extends({}, props, {
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
  children: func,
  observe: bool,
  onChange: func
} : void 0;

Rect.defaultProps = {
  observe: true
};

export function useRect(nodeRef) {
  var observe = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  var _useState = useState(null),
      rect = _useState[0],
      setRect = _useState[1];

  var observerRef = useRef(null);
  useLayoutEffect(function () {
    if (!observerRef.current) {
      observerRef.current = observeRect(nodeRef.current, setRect);
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

export default Rect;