/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** Simple extension that adds a "File > Hello World" menu item. Inserts "Hello, world!" at cursor pos. */
define(function (require, exports, module) {
    "use strict";
    
    require("thirdparty/jsonlint/jsonlint");

    var CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager  = brackets.getModule("editor/EditorManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        Menus          = brackets.getModule("command/Menus"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager");

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
            var obj;
            try {
                obj = JSON.parse(unformattedText);
            } catch (e) {
                
                try {
                    jsonlint.parse(unformattedText);
                } catch (err) {
                    
                    var parts = err.message.split('\n'),
                       re = /(\d+)/,
                       line = re.exec(parts[0]);

                    if (line) {
                        line = line[0];
                        var ch = parts[2].length - 1;

                        alert("line " + line + ", column " + ch);
                    }
                }
                return;
            }
            // Format JSON based on the current editor settings
            var formattedText = JSON.stringify(obj, null, (PreferencesManager.get("useTabChar")?"\t":PreferencesManager.get("spaceUnits"));
            
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
    
    function lintFile(text, fullPath) {
        try {
            jsonlint.parse(text);
        } catch (e) {
            var parts = e.message.split('\n'),
                re = /(\d+)/,
                line = re.exec(parts[0]);

            if (line) {
                line = line[0];
                var ch = parts[2].length - 1;
                var error = { 
                    pos:     {line: line - 1, ch: ch},
                    message: "line " + line + ", column " + ch + ":",
                    type:    CodeInspection.Type.ERROR
                };

                return {errors: [error]};
            }
        }

        return null;
    }

    // Register for JSON files
    CodeInspection.register("json", {
        name: "PrettyJson",
        scanFile: lintFile
    });
    
    // First, register a command - a UI-less object associating an id to a handler
    var MY_COMMAND_ID = "PrettyJson.MakePrettyJson";   // package-style naming to avoid collisions
    CommandManager.register("JSON Formatter", MY_COMMAND_ID, prettyJson);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    // we use J here because P conficts with pep8 checker.
    menu.addMenuItem(MY_COMMAND_ID, "Ctrl-Shift-J");

    exports.prettyJson = prettyJson;
});