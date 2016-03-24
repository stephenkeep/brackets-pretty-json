/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

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

    var jsonlint = window.jsonlint;

    jsonlint.parseError = jsonlint.lexer.parseError = function (str, hash) {
        var err = new Error(str);
        err.line = hash.loc.first_line;
        err.col = hash.loc.last_column;
        err.token = hash.token;
        err.expected = hash.expected;
        throw err;
    };

    function jsonText(text) {
        try {
            jsonlint.parse(text);
        } catch (e) {
            var message = "Expecting: " + e.expected.join(", ") + ". Found: '" + e.token + "'.";
            var error = {
                pos: {
                    line: e.line,
                    ch: e.col
                },
                message: message,
                type: CodeInspection.Type.ERROR,
                e: e // Used only to track the original exception
            };

            return error;
        }

        return null;
    }

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
                var error = jsonText(unformattedText);
                if (error) {
                    window.alert(error.message + "\nline " + error.pos.line + ", column " + error.pos.ch);
                }
                return;
            }
            // Format JSON based on the current editor settings
            var formattedText = JSON.stringify(obj, null, (PreferencesManager.get("useTabChar") ? "\t" : PreferencesManager.get("spaceUnits")));
            
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
        var error = jsonText(text);
        if (error) {
            error.pos.line--;
            return { errors: [error] };
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
    CommandManager.register("Pretty Json", MY_COMMAND_ID, prettyJson);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    // we use J here because P conficts with pep8 checker.
    menu.addMenuItem(MY_COMMAND_ID, "Ctrl-Shift-J");

    exports.prettyJson = prettyJson;
});