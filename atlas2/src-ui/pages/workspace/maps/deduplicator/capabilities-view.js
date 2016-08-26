/*jshint esversion: 6 */

import React, {PropTypes} from 'react';
import {
  Grid,
  Row,
  Col,
  Jumbotron,
  Button,
  Table,
  ListGroup,
  Popover,
  OverlayTrigger,
  Glyphicon
} from 'react-bootstrap';
import Actions from '../../../../actions';
import _ from "underscore";
var CreateNewCapabilityDialog = require('./create-new-capability');
import {getStyleForType} from './../editor/component-styles';

var acceptorStyle = {
  width: "100%",
  height: "35px",
  lineHeight: "35px",
  textAlign: "center",
  verticalAlign: "middle",
  margin: "1px",
  color: "white"
};

var capabilityStyle = {
  textAlign: "center"
};

var greyLaneStyle = {
  position: 'absolute',
  left: 1,
  right: 1,
  top: 5,
  height: 20,
  margin: "1px",
  backgroundColor: '#f8f8f8'
};
export default class CapabilitiesView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newCapabilityDialog: {
        open: false
      }
    };
  }
  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'copy';
  }
  handleDropExistingCapability(categoryId, capabilityID, e) {

    e.stopPropagation();
    var copyOfNode = JSON.parse(e.dataTransfer.getData('json'));
    // console.log('drop', e, capabilityID, categoryId, item);
    Actions.assignNodeToCapability(this.props.workspace._id, categoryId, capabilityID, copyOfNode.mapID, copyOfNode._id);
  }

  handleDropNewCapability(cat, e) {
    console.log('new capability', e, cat);
    var newState = {
      newCapabilityDialog: {
        open: true,
        item: JSON.parse(e.dataTransfer.getData('json')),
        categoryId: cat
      }
    };
    this.setState(newState);
  }
  cancelDialog() {
    var newState = {
      newCapabilityDialog: {
        open: false,
        item: null,
        categoryId: null
      }
    };
    this.setState(newState);
  }
  submitDialog(capabilityCategory, newCapabilityName, copyOfNode) {
    Actions.createNewCapabilityAndAssingNodeToIt(this.props.workspace._id, capabilityCategory, newCapabilityName, copyOfNode.mapID, copyOfNode._id);
    var newState = {
      newCapabilityDialog: {
        open: false,
        item: null,
        categoryId: null
      }
    };
    this.setState(newState);
  }

  clearNodeAssignement(mapID, nodeID, e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.stopPropagation();
    Actions.clearNodeAssignement(this.props.workspace._id, mapID, nodeID);
  }

  renderNodeInACapability(node) {
    var style = getStyleForType(node.type);
    style.left = node.x * 100 + '%';
    style.position = 'absolute';
    style.top = "10px";
    var linkToMap = "/map/" + node.mapID;
    var _popover = (
      <Popover id={node.name} title="Component details">
        <p>Name: {node.name}</p>
        <p>Map:
          <a href={linkToMap}>{node.mapName}</a>
        </p>
        <p>
          <a href="#" onClick={this.clearNodeAssignement.bind(this, node.mapID, node._id)}>Remove from this capability
          </a>
        </p>
      </Popover>
    );
    //
    return (
      <OverlayTrigger trigger="click" placement="bottom" overlay={_popover}>
        <div style={style}></div>
      </OverlayTrigger>
    );
  }

  renderFoundNodesInCapability(capabilityID) {
    var nodesToDisplay = [];
    var components = this.props.categorizedComponents;
    if (!components) {
      return null;
    }
    components.map(node => {
      if (node.category === capabilityID) {
        nodesToDisplay.push(node);
      }
    });
    return nodesToDisplay.map(node => this.renderNodeInACapability(node));
  }
  render() {
    var _acceptorStyleToSet = _.clone(acceptorStyle);
    var _capabilityStyleToSet = _.clone(capabilityStyle);
    var _greyLaneStyleToSet = _.clone(greyLaneStyle);
    if (this.props.dragStarted) {
      _acceptorStyleToSet = _.extend(_acceptorStyleToSet, {
        borderColor: "#00789b",
        boxShadow: "0 0 10px #00789b",
        border: '1px solid #00789b',
        color: 'black'
      });
      _greyLaneStyleToSet = _.extend(_greyLaneStyleToSet, {
        borderColor: "#00789b",
        boxShadow: "0 0 5px #00789b",
        border: '1px solid #00789b'
      });
    }

    var categories = null;
    if (this.props.workspace && this.props.workspace.capabilityCategories) {
      for (var i = 0; i < this.props.workspace.capabilityCategories.length; i++) {
        if (!categories) {
          categories = [];
        }
        var category = this.props.workspace.capabilityCategories[i];
        categories.push(
          <Row className="show-grid">
            <Col xs={3}>
              <h4>{category.name}&nbsp;capabilities</h4>
            </Col>
            <Col xs={9}>
              <div style={_acceptorStyleToSet} onDragOver={this.handleDragOver.bind(this)} onDrop={this.handleDropNewCapability.bind(this, category._id)}>Drop here to create a new capability in this category</div>
            </Col>
          </Row>
        );
        if (category.capabilities) {
          for (var j = 0; j < category.capabilities.length; j++) {
            var capability = category.capabilities[j];
            var _itemsToDisplay = this.renderFoundNodesInCapability(capability._id);
            categories.push(
              <Row className="show-grid">
                <Col xs={3}>
                  <div style={{
                    textAlign: "right"
                  }}>
                    <h5>{capability.name}</h5>
                  </div>
                </Col>
                <Col xs={9}>
                  <div style={_capabilityStyleToSet} onDragOver={this.handleDragOver.bind(this)} onDrop={this.handleDropExistingCapability.bind(this, category._id, capability._id)}>
                    <div style={_greyLaneStyleToSet}></div>
                    {_itemsToDisplay}
                  </div>
                </Col>
              </Row>
            );
          }
        }
      }
    }

    var dialogOpen = this.state.newCapabilityDialog.open;
    var nodeBeingAssigned = this.state.newCapabilityDialog.item;
    var capabilityCategory = this.state.newCapabilityDialog.categoryId;
    var _this;
    return (
      <Grid fluid={true}>
        {categories}
        <CreateNewCapabilityDialog open={dialogOpen} nodeBeingAssigned={nodeBeingAssigned} capabilityCategory={capabilityCategory} cancel={this.cancelDialog.bind(this)} submitDialog={this.submitDialog.bind(this)}/>
      </Grid>
    );
  }
}