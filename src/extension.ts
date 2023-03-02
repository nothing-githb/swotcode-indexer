import * as vscode from "vscode";
import { MyReferenceProvider } from "./MySymbolProvider";

export function activate(context: vscode.ExtensionContext) {
    // Create a new instance of `MyTreeViewProvider`.
	const mySymbolViewProvider = new MyReferenceProvider('fileExplorer.openFile', 'global -x');
	let is_sync: boolean = true;

    // Register the tree view provider.
	vscode.window.registerTreeDataProvider('mySymbolView', mySymbolViewProvider);

	vscode.commands.registerCommand('myExtension.regenGtags', () => {
		mySymbolViewProvider.regenGtags();
	});
	
	const myrefViewProvider = new MyReferenceProvider('fileExplorer.openFile2', 'global -xr');

	// Register the tree view provider.
	vscode.window.registerTreeDataProvider('myReferenceView', myrefViewProvider);
	
	// Create a command to trigger a refresh of the tree view.
	vscode.commands.registerCommand('myExtension.refreshTree', () => {
		mySymbolViewProvider.refresh("");
		myrefViewProvider.refresh("");
	});

	let isEnabled = false;

	const toggleCommand = vscode.commands.registerCommand('myExtension.syncWithEditor', () => {
		is_sync = !is_sync;
		if (is_sync)
		{
			mySymbolViewProvider.refresh("");
			myrefViewProvider.refresh("");
		}
	});


	vscode.commands.registerCommand('swotcodeIndexer.getInput', () => {

		vscode.window.showInputBox({
			title: 'Enter some text',
			prompt: 'Please enter some text:',
		}).then((input) => {

			if (input)
			{
				mySymbolViewProvider.refresh(input.toString());
				myrefViewProvider.refresh(input.toString());
			}
			else
			{
				mySymbolViewProvider.refresh("");
				myrefViewProvider.refresh("");
			}

			console.log(input); // log the input to the console
		});

	});

	// Listen for the onDidChangeTextEditorSelection event
	vscode.window.onDidChangeTextEditorSelection(event => {
		let word = getWordAtCursor();
		if (word && is_sync)
		{
			console.log('On did change: ' + word);
			mySymbolViewProvider.refresh(word);
			myrefViewProvider.refresh(word);
		}
	});

}

function getWordAtCursor() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const position = editor.selection.active;
      const range = document.getWordRangeAtPosition(position);
      if (range) {
        const word = document.getText(range);
        return word;
      }
    }
}