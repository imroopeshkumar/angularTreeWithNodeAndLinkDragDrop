import { Component, Input } from '@angular/core';
import * as constants from './constants';
import * as d3 from 'd3';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from "rxjs/Subject";
import { element } from 'protractor';

/**
 * $ is to use jquery functions
 */
declare let $: any
/**
 * The FDC Tree component for creating tree and maintaing tree structure
 */
@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
/* Class FDCTreeViewComponent */
export class AppComponent {
    /* Global variable declaration section */
    currentDate = new Date();
    currentMS = this.currentDate.getTime();
    /**
     * Defining current width for aspectratio purpose
     */
    addnewEntity$;
    currentWidth: number;

    clickDifferentiator = [];


    /**
     * Defining current height for aspectratio purpose
     */
    count = 0;
    currentHeight: number;
    /**
     * Assigning the current width to a variable
     */
    width = this.currentWidth;
    /**
     * Assigning the current height to a variable
     */
    height = this.currentHeight;
    /**
     * Setting margin as top,bottom,left and right
     */
    margin = { top: 10, right: 20, bottom: 30, left: 0 };
    /**
     * The data-binding value for input tag linksData
     */
    @Input() linksData
    /**
     * for defining treeSvg
     */
    svg
    /**
     * main root node which contains all children data
     */
    root
    /**
     * holds treedata to construct tree/graph
     */
    tree
    /**
     * To view tree data
     */
    view
    /**
     * For zooming the d3 section
     */
    zoom
    /**
     * To link between node to node
     */
    link
    /**
     * For zooming the tree section
     */
    zoomvar
    /**
     * For assinging the full tree node json data to nodesMap
     */
    nodesMap
    /**
     * declaration of duration
     */
    duration = 750
    /**
     * setting min zoom
     */
    minimumZoom = -5
    /**
     * setting max zoom
     */
    maximumZoom = 5

    linkIds
    linksMap
    links
    /* toggle for link change*/
    isChecked

    dragNodedata;
    static fdcDataList;
    draggingNode
    selectedNode
    dragStarted
    domNode
    test

    draggingLink
    private ngUnsubscribe: Subject<any> = new Subject();
    /**
     * To initialize the component and Respond after Angular initializes the component's views and child views
     * 
     * @example example of ngAfterViewInit() method
     * 
     * ngAfterViewInit(){
     *  // Todo
     * }
     */
    ngAfterViewInit() {
        // console.log(constants.data);
        let treeeeee = this.flatToHierarchy(constants.data);
        treeeeee = treeeeee[0];
        // console.log(treeeeee)
        this.renderTree(treeeeee, this.nodeClickHandler);
        // setTimeout(() => {
        //     constants.data.forEach(element => {
        //         if ('specialParents' in element) {
        //             console.log(element);
        //             console.log(element.specialParents)
        //             element.specialParents.forEach(e => {

        //                 this.addSpecialParent2(element, e);
        //             });
        //         }
        //     })
    
        // }, 1000);
        let property = 'specialParents';

        d3.select('body').on('click', () => {
            // console.log(d3.mouse(this));
        })

    }
    /**
     * This is the example to create Constructor for fdc component
     * 
     * @example example of constructor
     * 
     * constructor(){
     *  // Todo
     * }
*/
    /**
     * TO create the tree body structure
     * @param {string} realData parameter for taking the tree json data
     * 
     * @example This is the example for generateTree
     * 
     * generateTree(){
     *  // Todo
     * }
     */
    flatToHierarchy(list) {

        //console.log(this.list);
        let roots = [];
        let all = {};
        list.forEach(Element => {
            all[Element.EntityId] = Element;
        });

        // console.log(JSON.stringify(all))

        // console.log(all);


        Object.keys(all).forEach(Element => {
            let item = all[Element];
            // if(item.)
            // console.log(item);
            if (item.parent.id == "" || item.parent.id == null) {
                roots.push(item);

            }
            else if (item.parent.id in all) {
                let p = all[item.parent.id];
                if (!p.Children) {
                    p.Children = [];
                }
                p.Children.push(item);
            }
        });


        //console.log(roots);

        return roots;
    }




    generateTree(realData) {
        try {
            console.log(realData);
            let data = JSON.parse(JSON.stringify(realData)),
                dataMap = this.reduceArray(data),
                treeData = [];
            var flag = false;
            //Adding data-target attribute with id's of targets of every node
            data.forEach((node, index) => {
                node.index = index;
                if (node.parents_id) {
                    let parentLength = node.parents_id.length;
                    node.parents_id.forEach((parentItem, index) => {
                        let parent = dataMap[parentItem.id];
                        if (parentLength > 1) {
                            if (index !== parentLength - 1) {
                                if (!parent.data_targets_id) {
                                    parent.data_targets_id = [{
                                        id: node.product_id,
                                        type: parentItem.type
                                    }];
                                    flag = true
                                } else {
                                    parent.data_targets_id.push({
                                        id: node.product_id,
                                        type: parentItem.type
                                    });
                                    flag = true

                                }

                                return;
                            }
                        }
                        parent.children = parent.children || [];
                        node.type = parentItem.type;

                        parent.children.push(node);
                        //console.log(parent)
                    });
                } else {
                    treeData.push(node);
                }

            });

            return treeData[0];
        } catch (e) {
            console.error('Exception in generateTree() of FdcTreeComponent  at time ' + new Date().toString() + '. Exception is : ' + e);
        }
    }
    /**
     * This method is for rendering New node to D3 tree
     * @param {object} root D3 root node Object data which contains all its chidren
     * @param {string} nodeClickHandler parameter assigned to FDC Component
     * 
     * @example This is the example for renderTree
     * 
     * renderTree(){
     *  // Todo
     * }
     */
    renderTree(root, nodeClickHandler) {

        var self = this;
        let margin = constants.renderOptions.svgMargin,
            width = constants.renderOptions.svgWidth - margin.right - margin.left,
            height = constants.renderOptions.svgHeight - margin.top - margin.bottom,
            treemap,
            nodes,
            nodeGroup,
            links,
            nodesMap,
            isBackRelations;

        treemap = d3.tree().nodeSize([50, 50]);
        this.tree = treemap
        d3.select("#tree").selectAll('svg').remove();

        this.svg = d3.select("#tree").append("svg")
            //		.attr("width", width + margin.right + margin.left)
            .attr("width", "100%")
            //.attr("height", height + margin.top + margin.bottom)
            .attr("height", "1500px")
            .call(d3.zoom().scaleExtent([this.minimumZoom, this.maximumZoom])
                .on("zoom", () => {
                    self.svg.attr("transform", d3.event.transform);
                    self.zoomvar = d3.event.transform.k;
                }))

        //let view = this.svg.append("rect")
        //    .attr("class", "view")
        //    .attr("x", 0.5)
        //    .attr("y", 0.5)
        //    .attr("width", width - 1)
        //    .attr("height", height - 1);

        this.svg = this.svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        this.view = this.svg
        ////Append arrow
        this.svg.append("svg:defs").selectAll("marker")
            .data([constants.renderOptions.upsaleMarkerClass, constants.renderOptions.downsaleMarkerClass])
            .enter().append("svg:marker")
            .attr("id", String)
            .attr("class", String)
            .attr("viewBox", constants.renderOptions.markerCssStyles.viewBox)
            .attr("refX", constants.renderOptions.markerCssStyles.refX)
            .attr("refY", constants.renderOptions.markerCssStyles.refY)
            .attr("markerWidth", constants.renderOptions.markerCssStyles.markerWidth)
            .attr("markerHeight", constants.renderOptions.markerCssStyles.markerHeight)
            .attr("orient", constants.renderOptions.markerCssStyles.orient)
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5")

        this.root = d3.hierarchy(root, (d) => { return d.Children; });

        this.intializeNodesLinks();


    }
    /**
     * To initialise node  and link with each node
     * Getting Json data,It will parse the data for constructing Tree and Graph view
     * @example This is the example for intializeNodesLinks
     * 
     * intializeNodesLinks(){
     *  // Todo
     * }
     */
    intializeNodesLinks() {

        let self = this;
        let nodes, nodesMap, isBackRelations
        this.linkIds = 0

        // Assigns the x and y position for the nodes
        let treeData = this.tree(this.root);

        // Compute the new tree layout.
        nodes = treeData.descendants()

        this.links = treeData.links();

        nodesMap = this.reduceArray(nodes);
        this.nodesMap = nodesMap
        // Normalize for fixed-depth.
        isBackRelations = false;

        nodes.forEach((d) => {
            if (self.draggingNode && self.selectedNode) {
                if (d.data.EntityId === self.draggingNode.data.EntityId) {
                    d.depth = self.selectedNode.depth + 1;
                    d.eachBefore(e => {
                        e.depth = e.parent.depth + 1
                    })
                }
            }

            d.y = d.depth * constants.renderOptions.spaceBetweenDepthLevels;
            console.log('y'+d.y)
            console.log('x'+d.x)
            // console.log(d.y)
            d.x0 = d.x;
            d.y0 = d.y;

        });
        // this.reintializePositions(nodes);

        // function addFixedDepth() {
        //     nodes.forEach((d) => {
        //         if (d.data.data_targets_id) {
        //             let targets = d.data.data_targets_id;
        //             targets.forEach((currentTarget) => {
        //                 let target = nodesMap[currentTarget.id],
        //                     source = d;
        //                 if (source.y >= target.y) {
        //                     isBackRelations = true;
        //                     self.replaceNodeAndChildren(target, target, source.depth + 1);
        //                     target.depth = source.depth + 1;
        //                 }
        //             });
        //         }
        //     });
        //     if (isBackRelations) {
        //         isBackRelations = false;
        //         //addFixedDepth();
        //     }
        // }

        this.drawNodes(nodes);

        setTimeout(() => {
            // console.log(this.links)
            this.drawLinks(this.links)

        }, 200);

        nodes.forEach((d) => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        let zoom = d3.zoom()
            .scaleExtent([1, 40])
            .on("zoom", () => this.svg.attr("transform", d3.event.transform));
        this.view.call(zoom);
        var nodedata = d3.selectAll('g.node');
        var linkdata = d3.selectAll('path.link');
        nodedata.each(function (d) {
            try {
                if (d.data.Name == "lkjhgfdsa098765") {
                    d3.select(this).remove();
                }
            }
            catch (ex) {
                console.log(ex.message);
            }
        });
        // linkdata.each(function (d) {
        //     try {
        //         if (d.data.parent.id) {

        //             if (d.data.parent.id == "lkjhgfdsa098765") {
        //                 d3.select(this).remove();
        //             }
        //         }
        //     }
        //     catch (ex) {
        //         console.log(ex);
        //         return;
        //     }

        // });



    }





    //sendUpdate(updateNode) {
    //    let message = new MessageModel();
    //    message.EntityID = updateNode.EntityId;
    //    message.DataType = updateNode.DataType;
    //    message.MessageKind = 'PARTIALUPDATE';
    //    let payload = { "EntityId": message.EntityID, "TenantName": this.commonService.tenantName, "TenantId": this.commonService.tenantID, "EntityType": message.EntityType, "Fabric": "FDC", "ProductionDay": '', "EntityInfoJson": JSON.stringify(updateNode), "Info": "Admin" };
    //    message.PayLoad = JSON.stringify(payload);
    //    message.UserID = this.commonService.currentUserId;
    //    message.TenantID = this.commonService.tenantID;
    //    this.messagingservice.sendMessageToserver(message);

    //    payload = { "EntityId": 'FDCTREEJSON', "TenantName": this.commonService.tenantName, "TenantId": this.commonService.tenantID, "EntityType": message.EntityType, "Fabric": "FDC", "ProductionDay": '', "EntityInfoJson": JSON.stringify(this.commonService.FdcTreedataNew), "Info": "Admin" };



    //}
    /**
     * For reinitialising  node to D3 Graph
     * It will check the availbale Children nodes with the Newnode,based on that node will be appended to respective node in D3 Graph
     * @param {object} nodes D3 Graph json object data coming from intializeNodesLinks method
     * 
     * @example This is the example for reintializePositions
     * 
     * reintializePositions(nodes){
     *  // Todo
     * }
     */
    reintializePositions(nodes) {

        // nodes.forEach((d) => {
        //     if (d.data.dockable) {
        //         let parents = d.data.parents_id;
        //         if (parents && parents.length > 0) {
        //             let parent = parents[0]
        //             nodes.filter(d1 => {
        //                 return parent.id == d1.data.EntityId;
        //             }).forEach(d2 => {
        //                 d.x = d2.x - 30
        //                 d.y = d2.y - 18
        //             })
        //         }
        //     }
        // });
        nodes.forEach((d) => {
            // if((d.x>5000)) {
            //     console.log('big');
            // d.x = d.x * 2

            // }
        })

    }
    /**
     * For replacing the node with children
     * @param {string} node parameter taken from intializeNodesLinks method which takes the target value
     * @param {string} root parameter taking the target value from intializeNodesLinks method
     * @param {string} distance parameter measure the distance between nodes
     * 
     * @example This is example for replaceNodeAndChildren
     * 
     * replaceNodeAndChildren(node, root, distance){
     *  // Todo
     * }
     */
    replaceNodeAndChildren(node, root, distance) {
        if (node.children) {
            node.children.forEach((child) => {
                this.replaceNodeAndChildren(child, root, distance);
            });
        }
        node.y = (distance + (node.depth - root.depth)) * constants.renderOptions.spaceBetweenDepthLevels;
        node.depth = (distance + (node.depth - root.depth));


    }

    //Function to update the temporary connector indicating dragging affiliation
    updateTempConnector() {
        let self = this;
        var data = [];
        if (self.draggingNode !== null && self.selectedNode !== null) {
            // have to flip the source coordinates since we did this for the existing connectors on the original tree
            data = [{
                source: self.selectedNode,
                target: self.draggingNode
            }];
        }
        var link = this.svg.selectAll(".templink").data(data);

        link.enter().append("path")
            .attr("class", "templink")
            .attr("d", this.linkPath1)
            .attr('pointer-events', 'none');

        link.attr("d", this.linkPath1);

        link.exit().remove();

    };

    /**
     * For constructing D3 GraphDiagram in the FDC fabric area
     * @param {object} nodes Parsed Json object data Coming from @intializeNodesLinks method
     * 
     * @example This is the example for drawNodes
     * 
     * drawNodes(nodes){
     *  // Todo
     * }
     */
    drawNodes(nodes) {

        let self = this;
        let root = this.root;
        let dragStarted = this.dragStarted;
        let domNode = this.domNode;
        let svg = this.svg;
        let tree = this.tree;

        let i = 0,
            node = this.svg.selectAll("g.node")
                .data(nodes, (d) => {

                    d.id = d.data.EntityId;
                    return d.data.EntityId;
                });
        let nodeEnter = node.enter().append("g")
            .attr("class", (d) => {
                let nodeClasses = constants.renderOptions.classes.nodeClass;
                if (d.hidden) {
                    nodeClasses += ' ' + constants.renderOptions.classes.classToHideElement;
                }
                return nodeClasses;
            }).attr("id", d => "a" + d.id)
            .attr("data-index", (d) => {
                return d.index;
            })
            .attr("data-parent-index", (d) => {
                if (d.parent) {
                    return d.parent.index;
                }
            })
            .attr("data-type", (d) => {
                return d.data.EntityType;
            })

        // UPDATE
        let nodeUpdate = nodeEnter.merge(node);

        var overCircle = (d) => {
            self.selectedNode = d;
            self.updateTempConnector();
        };
        var outCircle = (d) => {
            self.selectedNode = null;
            self.updateTempConnector();
        };

        // Transition to the proper position for the node
        nodeUpdate.transition()
            .duration(this.duration)
            .attr("transform", (d) => {
                return "translate(" + (d.y) + "," + (d.x) + ")";
            });

        // Remove any exiting nodes
        let nodeExit = node.exit().transition().duration(this.duration).remove();

        nodeUpdate.append("g");
        // nodeUpdate.append('circle').attr('r', 25);

        // nodeUpdate //here's how you get all the nodes
        //     .each(function (d) {
        //         // your update code here as it was in your example
        //         // let node = d3.select(this),
        //         //     data = d.data,
        //         //     url = "/images/AlThing UI Icon-Button Set v1/circle/" + data["EntityType"] + ".svg";
        //         //     // url = data.Icon;

        //         // d3.text(url, (error, xml) => {
        //         //     if (error) throw error;
        //         //     let icon = node.select("g"),
        //         //         elem = icon.html(xml)
        //         //     elem.select("svg").attr("viewBox", null);


        //         //     if (data["entity-type"] == "GasInjection_Icon" || data["entity-type"] == "WaterSource_Icon") {
        //         //         node.attr("style", "fill:purple;");
        //         //     }
        //         //     if (data["entity-type"] == "WaterInjection_Icon") {
        //         //         icon.selectAll("path").style("fill", "violet")
        //         //     }
        //         // });
        //         d3.select(d).append('circle').attr('r', 25)
        //     })
        // nodeEnter.append("image")
        //    .attr("xlink:href", (d) => {
        //        return d.data.Icon;
        //    }).attr("x", 0)
        //    .attr("y", -15)
        //    .attr("width", 33)
        //    .attr("height", 33)
        d3.select('svg').selectAll('text').remove();

        nodeEnter.append('circle').attr('r', 25)
        nodeUpdate.append("text")
            .attr("x", (d) => {
                /*jslint nomen: true*/
                return d.children || d._children ? constants.renderOptions.circleCssStyles.text.dx.right : constants.renderOptions.circleCssStyles.text.dx.left;
            })
            .attr("dy", constants.renderOptions.circleCssStyles.text.dy)
            .attr("text-anchor", (d) => {
                /*jslint nomen: true*/
                return d.children || d._children ? "end" : "start";
            }).text((d) => { return d.data.Name; })
            .style("fill-opacity", constants.renderOptions.circleCssStyles.fillOpacity);

        nodeUpdate.on('click', (d) => {
            if (d3.event.defaultPrevented) return; // click suppressed

            self.clickDifferentiator.push(
                setTimeout(() => {
                    d = this.click(d);
                    this.intializeNodesLinks();
                }, 250));
        });


        setTimeout(() => {
            // constants.data.forEach(element => {
            //     if ('specialParents' in element) {
            //         console.log(element);
            //         console.log(element.specialParents)
            //         element.specialParents.forEach(e => {

            //             this.addSpecialParent2(element, e);
            //         });
            //     }
            // })

            self.root.eachBefore(element=> {
                if ('specialParents2' in element.data) {
                    element.data.specialParents2.forEach(e => {
                        
                        this.addSpecialParent2(element.data, e);
                    });
                }
            })
    
        }, 1000);



        //function setNodeDepth(d) {
        //    d.depth = d == root ? 0 : d.parent.depth + 1;
        //    if (d.children) {
        //        d.children.forEach(setNodeDepth);
        //    } else if (d._children) {
        //        d._children.forEach(setNodeDepth);
        //    }
        //}
        nodeUpdate.attr('pointer-events', 'mouseover')
            .on("mouseover", function (node) {
                self.selectedNode = node;
                if (self.draggingNode && self.selectedNode) {
                    if (self.draggingNode != self.selectedNode) {
                        overCircle(node);
                    }
                }
                if (self.draggingLink && self.selectedNode) {
                    self.draggingNode = self.draggingLink.source
                    overCircle(node);
                }
            }).on("mouseout", function (node) {
                self.selectedNode = null;
                if (self.draggingNode) {
                    outCircle(node);
                }
            });

        //create drag handler with d3.drag()
        function initiateDrag(d, domNode) {
            self.draggingNode = d;
            d3.select(domNode).attr('class', 'node activeDrag');

            svg.selectAll("g.node").sort(function (a, b) { // select the parent and sort the path's
                if (a.data.EntityId != self.draggingNode.data.EntityId) return 1; // a is not the hovered element, send "a" to the back
                else return -1; // a is the hovered element, bring "a" to the front
            });

            if (self.dragNodedata) {
                //if nodes has children, remove the links and nodes
                if (self.dragNodedata.length > 1) {
                    // remove link paths
                    let links = tree(self.draggingNode).links();
                    let nodePaths = svg.selectAll("path.link")
                        .data(links, function (d) {
                            return d.target.id;
                        }).remove();

                    // remove child nodes
                    let nodesExit = svg.selectAll("g.node")
                        .data(self.dragNodedata, function (d) {
                            return d.id;
                        }).filter(function (d, i) {
                            if (d.id == self.draggingNode.id) {
                                return false;
                            }
                            return true;
                        }).remove();
                }

                // remove parent link
                let parentLink = tree(self.draggingNode.parent).links();
                svg.selectAll('path.link').filter(function (d, i) {
                    if (d.target.id == self.draggingNode.id) {
                        return true;
                    }
                    return false;
                }).remove();

                dragStarted = null;
            }
        }

        //create drag handler with d3.drag()
        let drag_handler = d3.drag()
            .on("start", dragStart)
            .on("drag", drag_drag)
            .on("end", dragEnd)

        function dragStart(d) {
            // console.log("dragStart");
            dragStarted = true;
            self.dragNodedata = tree(d).descendants();
            d3.event.sourceEvent.stopPropagation();
        }

        function drag_drag(d) {
            // console.log("drag_drag");
            if (dragStarted) {
                domNode = this;
                initiateDrag(d, domNode);
            }
            d.x0 += d3.event.dy;
            d.y0 += d3.event.dx;

            d3.select(this).attr("transform", () => "translate(" + d.y0 + "," + d.x0 + ")");
            //updateTempConnector();
        }

        function dragEnd(d) {
            domNode = this;
            if (self.selectedNode && self.draggingNode && self.selectedNode != self.draggingNode) {
                // now remove the element from the parent, and insert it into the new elements children
                var index = self.draggingNode.parent.children.indexOf(self.draggingNode);
                if (index > -1) {
                    self.draggingNode.parent.children.splice(index, 1);
                    if (self.draggingNode.parent.children.length == 0) {
                        self.draggingNode.parent.children = null;
                    }
                }
                if (self.selectedNode.children !== null && (typeof self.selectedNode.children !== 'undefined' || typeof self.selectedNode._children !== 'undefined')) {
                    if (typeof self.selectedNode.children !== 'undefined') {
                        self.selectedNode.children.push(self.draggingNode);
                        self.draggingNode.parent = self.selectedNode;
                    } else {
                        self.selectedNode._children.push(self.draggingNode);
                    }
                } else {
                    self.selectedNode.children = [];
                    self.selectedNode.children.push(self.draggingNode);
                    self.draggingNode.parent = self.selectedNode;
                }

                let updateNode = self.draggingNode.data;
                updateNode.parent.id = self.selectedNode.data.EntityId;
                updateNode.parent.text = self.selectedNode.data.Name;
                updateNode.Fabric = 'FDC';
                updateNode.Info = 'Admin';

                endDrag();
            } else {
                endDrag();
            }
        }


        function endDrag() {
            d3.select(domNode).attr('class', 'node');

            if (self.draggingNode !== null && self.draggingNode != undefined) {
                self.intializeNodesLinks();
                self.draggingNode = null;
            }
            self.updateTempConnector();
            self.selectedNode = null;



        }

        //apply the drag_handler to our circles 
        drag_handler(nodeUpdate);

        return nodeUpdate

    }


    /**
     * To draw the link between node to node from staring and ending point
     * @param {object} links parameter taking the treeData and linking with the links which is taken form intializeNodesLinks methods
     * @param {object} nodes parameter nodes using tree json for all nodes which is taken form intializeNodesLinks methods
     * 
     * @example This is the example to drawLinks
     * 
     * drawLinks(links, nodes){
     *  // Todo
     * }
     */
    drawLinks(links) {

        let self = this;

        let link, targets, maxTargetsCount;
        link = this.svg.selectAll("path.link")
            .data(links, (d) => {
                if (!d.id) {
                    self.linkIds += 1;
                    d.id = self.linkIds;
                }
                return d.id;
            })
        let linkEnter = link.enter().insert("path", "g")
            .attr("id", d => { return d.id; })
            .attr("class", (d) => {
                let linkClasses = constants.renderOptions.classes.linkClass;
                if (d.source.data.data_targets_id) {
                    targets = d.source.data.data_targets_id;
                    targets.forEach((currentTarget) => {
                        if (currentTarget.type === d.target.data.type) {
                            linkClasses += ' ' + constants.renderOptions.classes.classToHideElement;
                        }
                    });
                }
                return linkClasses;
            })
            .attr("stroke", "#ccc")
            .call(d3.drag()
                .on("start", this.linkDragStart.bind(this))
                .on("drag", self.linkDragging.bind(self))
                .on("end", this.linkDragEnd.bind(self)));



        this.link = link

        // constants.data.forEach(element => {
        //     if ('specialParents' in element) {
        //         console.log(element);
        //         element.specialParents.forEach(e => {
        //             this.addSpecialParent2(element, e);
        //         });
        //     }
        // })

       

   


        maxTargetsCount = 0;
        // UPDATE
        let linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate.transition()
            .duration(this.duration)
            .attr("d", (d) => this.linkPath(d))
            .attr("marker-end", (d) => {
                if (!d.target.data.dockable)
                    return "url(#upsale" + constants.renderOptions.markerClassEnd + ")";
                else
                    return null;
            })

        // Remove any exiting links
        let linkExit = link.exit().transition()
            .duration(this.duration)
            .remove();
        //Adding links in case when it is several parents for one node

        // this.addSpecialParent(0, targets, maxTargetsCount);

    }
    /**
     * Taking json from drawLinks() method
     * @param {number} position parameter for taking position as 0
     * @param {object} targets parameter target taking obj data
     * @param {number} maxTargetsCount parameter maxTargetsCount taking number
     * @param {number} linkIds parameter linkIds taking id of links example linkId = 55
     * 
     * @example This is the example for addSpecialParent
     * 
     * addSpecialParent(position, targets, maxTargetsCount, linkIds){
     *  // Todo
     * }
     */


    linkDragEnd(d) {
        let self =this;
        console.log(self);
        // let self = this;
        let  nodeid = "";
        if (self.selectedNode && self.draggingLink) {
            nodeid = d.source.data.EntityId;
            d.target.data.colorCode = "transparent";
            self.root.eachBefore(element => {
                if (element.data.EntityId === self.selectedNode.data.EntityId) {
                    if (!('specialParents2  ' in element.data)) {
                        console.log('nospecialparents');
                        element.data.specialParents2 = [];
                        element.data.specialParents2.push({
                            'id': nodeid,
                            'color_code': 'normal'
                        });

                    }

                    else {
                        element.data.specialParents2.push({
                            'id': nodeid,
                            'color_code': 'normal'
                        });
                    }
                }
            })
             
   
             self.addNewLink([{ source: self.draggingLink.source, target: self.selectedNode, id: self.linkIds += 1 }])
             self.updateOldLink(d.id);
         }
         self.selectedNode = null;
         this.updateTempConnector();
         self.draggingLink = null;
         self.draggingNode = null;

         

         console.log(d.target);
     }

    addSpecialParent2(source, target) {
        let self = this;
        console.log(this.nodesMap);
        let linknode = d3.select("g[id='a" + source.EntityId + "']").node();

        let src = this.nodesMap[source.EntityId];
        let tgt = this.nodesMap[target.id];
        let data = [{ source: tgt, target: src, id: this.linkIds += 1 }];
        d3.select(linknode.parentNode)
            .insert('path')
            .data(data)
            .attr("id", (d) => { return d.id; })
            .attr('d', d => this.linkPath(d))
            // .attr('class','link')
            .attr("class", (d) => {
                return constants.renderOptions.classes.linkClass;
            })
            .attr('stroke', 'blue')
            .call(d3.drag()
                .on("start", this.linkDragStart.bind(self))
                .on("drag", self.linkDragging.bind(self))
                .on("end", this.linkDragEnd.bind(self)));

   


    }








    addSpecialParent(position, targets, maxTargetsCount) {


        let nodesMap = this.nodesMap
        var self = this;
        let linkEnter = this.svg.selectAll("path.link")
            //.filter(d => {
            //    return (d.source != undefined) && (d.target != undefined)
            //}).filter(d => {
            //    return d.source.data.data_targets_id != undefined || d.target.data.data_targets_id != undefined
            //})
            .each(function (d) {
                d3.select(this.parentNode).insert("path")
                    .data(function (d1) {
                        targets = d.source.data.data_targets_id ? d.source.data.data_targets_id : d.target.data.data_targets_id;
                        let length = targets.length,
                            sep = ',',
                            newPath = '',
                            data,
                            pathDigitsMas,
                            pathDigitsAndSpacesMas,
                            spaceCoord;
                        if (length > maxTargetsCount) {
                            maxTargetsCount = length;
                        }

                        if (d.target.data.data_targets_id) {
                            let targetId = d.target.data.data_targets_id[0].id,
                                target = self.nodesMap[targetId];
                            data = [{ source: d.target, target: target, id: self.linkIds += 1 }];
                        } else {
                            data = [{ source: d.source, target: d.target, id: self.linkIds += 1 }];
                        }

                        return data;
                    })
                    .attr("d", function (d) {
                        return self.linkPath(d)
                    })
                    .attr("id", (d) => { return d.id; })
                    .attr("stroke", self.linkColor)
                    .attr("class", (d1) => {
                        return constants.renderOptions.classes.linkClass;
                    }).attr("marker-end", (d) => {
                        if (!d.target.data.dockable) {
                            return "url(#upsale" + constants.renderOptions.markerClassEnd + ")";
                        } else {
                            return null;
                        }
                    })
                    .call(d3.drag()
                        .on("start", self.linkDragStart.bind(self))
                        .on("drag", self.linkDragging.bind(self))
                        .on("end", this.linkDragEnd.bind(self)))
            });


        


    }



    addNewLink(linkData) {

        let self = this;
        let linkExist
        let existLinkId
        this.links.forEach(link => {
            if (link.source.id == linkData[0].source.id && link.target.id == linkData[0].target.id) {
                linkExist = true
                existLinkId = link.id
                link.target.data.colorCode = "#ccc"
            }
        });
        if (!linkExist) {
            this.links.push(linkData[0])
            // if (linkData[0].source.children)
            //     linkData[0].source.children.push(self.selectedNode);
            // else {
            //     linkData[0].source.children = []
            //     linkData[0].source.children.push(self.selectedNode);
            // }
            // this.addSpecialParent2()
            // linkData[0].source.data.data_targets_id = [{
            //     id: linkData[0].target.data.product_id,
            //     type: linkData[0].target.data.type
            //    }];
            let link = this.svg.append("path").data(linkData)
                .attr("id", function (d) {
                    return d.id
                })
                .attr("class", (d) => {
                    return constants.renderOptions.classes.linkClass;
                })
                .attr("d", this.linkPath)
                .attr("stroke", self.linkColor)
                .attr("marker-end", (d) => {
                    if (!d.target.data.dockable) {
                        return "url(#upsale" + constants.renderOptions.markerClassEnd + ")";
                    } else {
                        return null;
                    }
                })
                .call(d3.drag()
                    .on("start", self.linkDragStart.bind(self))
                    .on("drag", self.linkDragging.bind(self))
                    .on("end", this.linkDragEnd.bind(self)));
        }
        else {
            let link = this.svg.selectAll("path.link")

            // Transition back to the parent element position
            link.filter(function (d) {
                if (d.id == existLinkId) return d;
            })
                .attr("stroke", (d) => { return d.target.data.colorCode; })
                .attr("marker-end", (d) => {
                    if (!d.target.data.dockable) {
                        return "url(#upsale" + constants.renderOptions.markerClassEnd + ")";
                    } else {
                        return null;
                    }
                })
        }



  

    }

    updateOldLink(linkId) {

        let link = this.svg.selectAll("path.link")

        // Transition back to the parent element position
        link.filter(function (d) {
            if (d.id == linkId)
                return d;
        })
            .attr("stroke", function (d) {
                return d.target.data.colorCode;
            })
            .attr("marker-end", null)

    }

    /**
     * This method will trigger ,after node hasbeen dragged available in graph canvas
     * Postion changes to new dragged  postion
     * @param {object} d selected D3 object data that is dragged
     * 
     * @example of linkPath() method
     * 
     * linkPath(d){
     *  // Todo
     * }
     */
    linkPath(d) {

        try {

            let x1 = d.source.x,
                x2 = d.target.x,
                y1 = d.source.y,
                y2 = d.target.y,
                sourceId = d.source.id,
                targetId = d.target.id,
                source = d3.select("#a" + sourceId).select("g").node().getBBox(),
                target = d3.select("#a" + targetId).select("g").node().getBBox();
            if (!d.target.data.dockable) {

                x1 = x1 + (source.height / 2)
                y1 = y1 + source.width
                x2 = x2 + (target.height / 2)
                y2 = y2
                return "M" + y1 + "," + x1 +
                    "C" + (y1 + y2) / 2 + "," + x1 +
                    " " + (y1 + y2) / 2 + "," + x2 +
                    " " + y2 + "," + x2;

            } else {
                x1 = x1
                y1 = y1 + (source.width / 2)
                x2 = x2 + (target.height)
                y2 = y2 + (target.width / 2)
                return "M" + y1 + "," + x1 +
                    " " + y2 + "," + x2;
            }
        }
        catch (ex) {
            return;
        }

    }

    linkDragStart(d) {
        d3.event.sourceEvent.stopPropagation();
    }

    linkDragging(d) {
        
        //console.log("speciallinkDragging")
        this.draggingLink = d;
    }
    /**
     * This method will trigger ,after node hasbeen dragged available in graph canvas
     * Postion changes to new dragged  postion
     * @param {object} d selected D3 object data that is dragged
     * 
     * @example of linkPath1() method
     * 
     * linkPath1(d){
     *  // Todo
     * }
     */
    linkPath1(d) {

        let x1 = d.source.x,
            x2 = d.target.x0,
            y1 = d.source.y,
            y2 = d.target.y0,
            sourceId = d.source.id,
            targetId = d.target.id,
            source = d3.select("#a" + sourceId).select("g").node().getBBox(),
            target = d3.select("#a" + targetId).select("g").node().getBBox();

        x1 = x1 + (source.height / 2)
        y1 = y1 + source.width / 2
        x2 = x2 + (target.height / 2)
        y2 = y2 + target.width / 2

        return "M" + y1 + "," + x1 +
            " " + y2 + "," + x2;

    }

    /**
     *nodeClickHandler() used for calling renderTree() method
     * @param {string} self reference from FDCTreeViewComponent component
     * 
     * @example This is the example of nodeClickHandler
     * 
     * nodeClickHandler(self){
     *  // Todo
     * }
     */
    nodeClickHandler(self: AppComponent) {

    }
    /**
     * For redrawing the d3 tree for node to node
     */
    redrawGraph() {
        $('svg').remove();
        this.svg = null;
        this.renderTree(this.generateTree(constants.data), this.nodeClickHandler);

    }

    /**
     * taking status as 0
     */
    status = 0
    /**
     * taking status1 as 0
     */
    status1 = 0
    /**
     * Toggling child node upon single click of D3 node
     * @param {object} d Current D3 node object data on which click event has been triggered
     * 
     * @example This is the example for toggleChild
     * 
     * toggleChild(){
     *  // Todo
     * }
     */
    toggleChild(d) {
        var links = d3.hierarchy(d).links()
        var parents = d.data.parents_id
        if (d.children) {
            d.children.forEach(e => this.toggleChild(e))

            this.status += 1
        } else {
            this.status1 += 1
        }
        return this.status + "\t" + this.status1;

    }
    /**
     * Toggling the children upon single click on D3 node
     * collapsing/expanding the children can be done based on single click on the D3 node
     * Allots the different image for the node for identifying its entitytype like drawings or Ideas category
     * @param {object} d Current D3 node object data on which click event has been triggered
     * 
     * @example This is the example for toggleChildren
     * 
     * toggleChildren(){
     *  // Todo
     * }
     */
    toggleChildren(d) {
        //	console.log(d)
        if (d.children) {
            //		console.log(this.toggleChild(d))
            this.status = 0
            this.status1 = 0
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;

    }
    /**
     * 
     * @param {object} arr collapsing the child node
     * 
     * @example This is the example for reduceArray
     * 
     * reduceArray(){
     *  // Todo
     * }
     */
    reduceArray(arr) {
        return arr.reduce((map, item) => {
            let EntityId = item.EntityId != null ? item.EntityId : item.data.EntityId
            map[EntityId] = item;
            return map;
        }, {});

    }

    /**
     * *
     * @param d
     * @example This is the example for color
     * color(){
     *  // Todo
     * }
     */
    color(d) {
        return d._children ? "#383838" : d.children ? "#383838" : "#383838";

    }

    click(d) {
        console.log('single click');
        let sel = d3.select(d).node();
        let u = d3.clientPoint(sel, 'click');
        // console.log(d3.mouse(sel));
        var self = this;
        if (d.children && d._children == null) {
            d._children = d.children;
            let otherschild = [];
            d.children.forEach((node) => {
                let parentLength = node.data.parents_id.length;
                if (parentLength > 1) {
                    otherschild.push(node);
                }
            });

            if (otherschild.length != 0)
                d.children = otherschild;
            else
                d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        return d;

    }

    linkColor(d) {
        return "#ccc";

    }
    /**
*
* For alloting icons to the tree/nodes based on its entity type 
*
* @param entityType entity type of the node
*
* @example example of getIcon() method
*
* getIcon(){
*     //todo
*  }
*/

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();

    }
}
