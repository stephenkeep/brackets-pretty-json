/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** Simple extension that adds a "File > Hello World" menu item. Inserts "Hello, world!" at cursor pos. */
define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager  = brackets.getModule("editor/EditorManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        Menus          = brackets.getModule("command/Menus");

    
    // Function to run when the menu item is clicked
    function prettyJson() {
        var editor = EditorManager.getCurrentFullEditor();
        if (editor) {
            var unformattedText, isSelection = false;
            
            var selectedText = editor.getSelectedText();
    
            var selection = editor.getSelection();
    
            if (selectedText.length > 0) {
                isSelection = true;
                unformattedText = selectedText;
            } else {
                unformattedText = DocumentManager.getCurrentDocument().getText();
            }
            
            var obj = JSON.parse(unformattedText);
            var formattedText = JSON.stringify(obj, null, "\t");
            
            var doc = DocumentManager.getCurrentDocument();
            
            doc.batchOperation(function () {

                if (isSelection) {
                    doc.replaceRange(formattedText, selection.start, selection.end);
                } else {
                    doc.setText(formattedText);
                }

            });
        }
    }
    
    
    // First, register a command - a UI-less object associating an id to a handler
    var MY_COMMAND_ID = "PrettyJson.MakePrettyJson";   // package-style naming to avoid collisions
    CommandManager.register("PrettyJson", MY_COMMAND_ID, prettyJson);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    menu.addMenuItem(MY_COMMAND_ID, "Ctrl-Shift-P");

    exports.prettyJson = prettyJson;
});