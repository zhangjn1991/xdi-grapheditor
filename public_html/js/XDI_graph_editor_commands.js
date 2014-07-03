/* 
The MIT License (MIT)

Copyright (c) 2014 Neustar Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
function deleteCommand () {
    var deletePerformed = false;
    if (hasSelectedNodes()) {
        selected_nodes.forEach(function (d) {
            removeNode(d);
            // removeLinksOfNode(d);
        })
        clearSelectedNodes();
        deletePerformed = true;
    }

    if (hasSelectedLinks()) {
        selected_links.forEach(function (d) {removeLink(d)});
        clearSelectedLinks();
        deletePerformed = true;
    }

    if(deletePerformed)
    {
        restart();
        backup();
    }
}

function editNameCommand(){
    if (hasSelectedLinks()) {
        selected_links.forEach(function(d) {
            var existinglabel = d.name;
            var labelval = prompt("Please enter a new value for this label", existinglabel);
            setLinkLabel(d,labelval);
        });
        restart(false,false);
    }
    if (hasSelectedNodes()) {
        selected_nodes.forEach(function(d) {
        var existingname = d.name;
        var nodename = prompt("Please enter a new name for this node", existingname);
        setNodeLabel(d,nodename);
        })
        restart(false,false);
    }
}




function fixNodeCommand () {
    if(hasSelectedNodes())
        selected_nodes.forEach(function(d) {toggleNodeFixed(d);});
}

function foldNodeCommand (isDirectDescendantsOnly) {
    if(hasSelectedNodes())
        selected_nodes.forEach(function(d) { return toggleFoldNode(d,isDirectDescendantsOnly);})
}

function createNodeByClick () {
    var nodename = prompt("Please enter the node's name", "");
    if(nodename === null)
        return;
    
    var nodeFound = findNode(globalNodes, nodename, lastGraphId);
    if (nodeFound) {
        if (nodename !== "")
        // Name already taken
            alert("Node already exists!");
        return;
    }
    var newnode = addNode(nodename,null, lastGraphId);
    var point;
    if(d3.event !== null)
        point = d3.mouse(svg.node());
    else
        point = [svgWidth/2,svgHeight/2];
    newnode.x = point[0];
    newnode.y = point[1];
    restart();

}

// Changing the Node type to literal or back to the default contextual 
function setLiteralNodeCommand () {
    if (hasSelectedNodes()) {
        selected_nodes.forEach(function(d) {
            setNodeIsLiteral(d,!d.isLiteral())
        })
        
        restart();
    }
}


// Setting a node as root, updating graphics too.
function setRootNodeCommand () {
    if (hasSelectedNodes()) {
    
        selected_nodes.forEach(function (d) {
            setNodeIsRoot(d,!d.isRoot());
        })
        
        restart();
    }
}



// Inversing the link direction
function invertLinkCommand () {
    if (hasSelectedLinks()) {
        selected_links.forEach(function(d) {
            inverseLinkDirection(d);
        });
        
        restart();
    }
}

function setDoubleArrowCommand () {
    if (hasSelectedLinks()) {
        // set link direction to both left and right
        selected_links.forEach(function(d) {
            if(d.left&&d.right)
                d.left = false
            else
            {
                d.left = true;
                d.right = true;
            }
        });
        
        restart();
    }
}


// Toggling a link relationship status on/off
function setRelationCommand () {
    if (hasSelectedLinks()) {

        selected_links.forEach(function(d) {
            setLinkIsRel(d,!d.isRelation);
        });

        restart();
    }
}




function startDragLine(){
    // reposition drag line
    drag_line
        .classed("hidden",false)
        .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
    isDraggingLine = true;
    restart(true,false);
}

function updateDragLine(){

    if(isDraggingLine && mousedown_node && curMousePos != null)
    {
        var startPos = {x:mousedown_node.x,y:mousedown_node.y};
        var endPos = curMousePos;
        drag_line.attr('d', 'M' + x(startPos.x) + ',' + y(startPos.y) + 'L' +
                (endPos.x) + ',' + (endPos.y));
    }   
}


function endDragLine(){
    if (isDraggingLine) {
        drag_line.classed("hidden",true)
        isDraggingLine = false;
    }
}

function startDrag(){
    d3.selectAll('.node')
        .call(nodeDrag);
}

function showShortName (HTMLElement) {
    d3.select(HTMLElement)
        .select("text")
        .text(function(d) { return d.shortName; });
}

function showTrimmedName (HTMLElement) {
    d3.select(HTMLElement)
        .select("text")
        .text(function(d) { return trimString(d.shortName,NODE_TEXT_MAX_LENGTH); });
}

function toggleNodeFixed (node) {
    setNodeFixed(node,!node.fixed);
}

function setNodeFixed (node, newValue) {
    node._fixed = newValue; //Record the fixed is set intentionally
    node.fixed =newValue;
    restart(false,false);
}

function toggleFoldNode(node,isDirectDescendantsOnly){
    setFoldNode(node,!node.isFolded,isDirectDescendantsOnly);
}

function setFoldNode (node,newValue,isDirectDescendantsOnly) {
    node.isFolded = newValue;

    //Set all children folded if only expand direct descendants
    if(isDirectDescendantsOnly && !node.isFolded && node.children != null)
    {
        node.children.forEach(function (d) {
            if(!_.isEmpty(d.children)&&!findLink(node,d).isRelation)
                d.isFolded = true;
        })
    }
    
    restart();    
}

function expandAllNodes(){
    globalNodes.forEach(function  (d) {
        d.isFolded = false;
    })
    restart();
}

function copySelection () {
    if(!hasSelectedNodes()) //Cannot copy links if there is no nodes
        return;

    copyObjectsToClipBoard(selected_nodes,selected_links);
    updateMenuItemAbility ();
}

function pasteToGraph () {
    if(_.isEmpty(clipBoard.nodes)) //Cannot paste if there is no nodes. Links cannot be pasted if there is no nodes two.
        return;

    pasteFromClipBoard();
    clearAllSelection();
    backup();
    restart();
}

function duplicateSelection () {
    if(!hasSelectedNodes()) //Cannot copy links if there is no nodes
        return;

    duplicateObjects(selected_nodes,selected_links);
    backup();
    restart();
}

function cutSelection () {
    if(!hasSelectedNodes()) //Cannot copy links if there is no nodes
        return;

    cutObjectsToClipBoard(selected_nodes,selected_links);
    clearAllSelection();
    backup();
    restart();
}

function setMenuItemAbility (classSelector,isEnabled) {
    d3.select(classSelector)
        .classed('disabled',isEnabled);
}

function updateMenuItemAbility () {
    d3.selectAll('.menu-item.selection').classed('disabled',!hasSelectedNodes()&&!hasSelectedLinks());
    d3.selectAll('.menu-item.selection.need-node').classed('disabled',!hasSelectedNodes());
    d3.selectAll('.menu-item.selection.need-link').classed('disabled',!hasSelectedLinks());

    d3.selectAll('#pasteCommand').classed('disabled',isClipBoardEmpty());
    d3.selectAll('.menu-item.need-content').classed('disabled',isGraphEmpty());
}

function selectAll () {
    if(!lastDrawData)
        return;
    
    //Only select visible nodes
    setSelectedNodes(lastDrawData.nodes);
    setSelectedLinks(lastDrawData.links);
    updateSelectionClass();
}

function initializeCommands(){
    backupData = [];
    currentBackupPos = -1;
    updateUndoRedoMenu();
}

function backup(){
    backupData = backupData.slice(0,currentBackupPos + 1);
    
    var res = cloneNodeLinks(globalNodes,globalLinks);
    backupData.push(res);
    currentBackupPos = backupData.length - 1;
    updateUndoRedoMenu();
    return res;
}
function restoreTo(backupPos){
    if(_.isEmpty(backupData))
        return;
    globalNodes = [];
    globalLinks = [];
    globalNodeLinkMap = {};
    pasteFrom(backupData[backupPos]);
    updateUndoRedoMenu();
    restart();
}

function undo(){
    if(currentBackupPos > 0)
    {
        currentBackupPos --;
        restoreTo(currentBackupPos);
    }
}

function redo () {
    if(currentBackupPos < backupData.length - 1)
    {
        currentBackupPos ++;
        restoreTo(currentBackupPos);
    }
    
}

function updateUndoRedoMenu () {
    d3.select('#undoMenuItem').classed('disabled',currentBackupPos===0);
    d3.select('#redoMenuItem').classed('disabled',currentBackupPos+1===backupData.length);
}