import ReactDOM from "react-dom";
import { MapControl, withLeaflet } from "react-leaflet";
import { Control, DomUtil, DomEvent } from "leaflet";


const getColor = d => {
  return d > 1000
    ? "#800026"
    : d > 500
    ? "#BD0026"
    : d > 200
    ? "#E31A1C"
    : d > 100
    ? "#FC4E2A"
    : d > 50
    ? "#FD8D3C"
    : d > 20
    ? "#FEB24C"
    : d > 10
    ? "#FED976"
    : "#FFEDA0";
};


const DumbControl = Control.extend({
  options: {
    className: "",
    onOff: "",
    handleOff: function noop() {},
  },

  onAdd(map) {
    var _div = DomUtil.create("_div", "info legend", this.options.className);
    DomEvent.disableClickPropagation(_div);
    const grades = [0, 10, 20, 50, 100, 200, 500, 1000];
    let labels = [];
    let from;
    let to;
    //let maxCases = this.max;
    for (let i = 0; i < grades.length; i++) {
      from = grades[i];
      to = grades[i + 1];

      labels.push(
        '<i style="background:' +
          getColor(from + 1) +
          '"></i> ' +
          from +
          (to ? "&ndash;" + to : "+")
      );
    }

    _div.innerHTML = labels.join("<br>");
    //ReactDOM.render(_div.innerHTML, _div);
    return _div;

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
      console.log("PROPS", props)
      return new DumbControl(Object.assign({}, props));
    }

    componentDidMount() {
      super.componentDidMount();

      // This is needed because the control is only attached to the map in
      // MapControl's componentDidMount, so the container is not available
      // until this is called. We need to now force a render so that the
      // portal and children are actually rendered.
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
