// This component belongs to 'LiveBy'
// source: https://github.com/LiveBy/react-leaflet-control/blob/master/LICENSE
// Copyright (c) 2016, LiveBy

import ReactDOM from "react-dom";
import { MapControl, withLeaflet } from "react-leaflet";
import { Control, DomUtil, DomEvent } from "leaflet";

const DumbControl = Control.extend({
  options: {
    className: "",
    onOff: "",
    handleOff: function noop() {}
  },

  onAdd(/* map */) {
    var _controlDiv = DomUtil.create("div", this.options.className);
    DomEvent.disableClickPropagation(_controlDiv);
    return _controlDiv;
  },

  onRemove(map) {
    if (this.options.onOff) {
      map.off(this.options.onOff, this.options.handleOff, this);
    }

    return this;
  }
});

export default withLeaflet(
  class LeafletControl extends MapControl {
    createLeafletElement(props) {
      return new DumbControl(Object.assign({}, props));
    }

    componentDidMount() {
      super.componentDidMount();
      this.forceUpdate();
    }

    render() {
      if (!this.leafletElement || !this.leafletElement.getContainer()) {
        return null;
      }
      return ReactDOM.createPortal(
        this.props.children,
        this.leafletElement.getContainer()
      );
    }
  }
);
