import { execSync } from "child_process";
import * as vscode from "vscode";
import { getWordAtCursor, MyReferenceProvider } from "./MySymbolProvider";

// Get the first workspace folder
const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

// Get the path of the workspace folder
const workspaceFolderPath = workspaceFolder?.uri.fsPath;

export var channel = vscode.window.createOutputChannel('SwotCode Indexer');

export function activate(context: vscode.ExtensionContext) {
	let isSync: boolean = false;
	
	logChannel('SwotCode indexer started.');

	logChannel(`Workspace folder path: ${workspaceFolderPath}`);

	const mySymbolViewProvider = new MyReferenceProvider('fileExplorer.openFile', 'global -x');

	logChannel('Symbol view created. (-x)');

	vscode.window.registerTreeDataProvider('mySymbolView', mySymbolViewProvider);

	vscode.commands.registerCommand('myExtension.regenGtags', () => {
		mySymbolViewProvider.regenGtags();
	});
	
	const myrefViewProvider = new MyReferenceProvider('fileExplorer.openFile2', 'global -xr');

	logChannel('Reference view created. (-xr)');

	// Register the tree view provider.
	vscode.window.registerTreeDataProvider('myReferenceView', myrefViewProvider);

	const myExtRefViewProvider = new MyReferenceProvider('fileExplorer.openFile3', 'global -sxr');

	logChannel('Extended Reference view created. (-sxr)');

	// Register the tree view provider.
	vscode.window.registerTreeDataProvider('myExtReferenceView', myExtRefViewProvider);

	// Create a command to trigger a refresh of the tree view.
	vscode.commands.registerCommand('myExtension.refreshTree', () => {
		logChannel(`Refresh with word under the cursor. -> ${getWordAtCursor()}`);
		mySymbolViewProvider.refresh("");
		myrefViewProvider.refresh("");
		myExtRefViewProvider.refresh("");
	});

	let isEnabled = false;

	const toggleCommand = vscode.commands.registerCommand('myExtension.syncWithEditor', () => {
		
		isSync = !isSync;
		logChannel(`Command: Sync with editor --> ${isSync}`); 

		if (isSync)
		{
			logChannel('Sync with editor is enabled.');
			mySymbolViewProvider.refresh("");
			myrefViewProvider.refresh("");
			myExtRefViewProvider.refresh("");
			vscode.window.showInformationMessage('Sync with editor is enabled.');
		}
		else {
			logChannel('Sync with editor is disabled.');
			vscode.window.showInformationMessage('Sync with editor is disabled.');
		}
	});

	vscode.commands.registerCommand('myExtension.getInput', () => {

		vscode.window.showInputBox({
			title: 'Enter some text',
			prompt: 'Please enter some text:',
		}).then((input) => {

			if (input)
			{
				mySymbolViewProvider.refresh(input.toString());
				myrefViewProvider.refresh(input.toString());
				myExtRefViewProvider.refresh(input.toString());
			}
			else
			{
				mySymbolViewProvider.refresh("");
				myrefViewProvider.refresh("");
				myExtRefViewProvider.refresh("");
			}

			logChannel(`Command: Get input --> ${input}`); // log the input to the console
		});

	});

	vscode.commands.registerCommand('myExtension.getInputWithList', () => {
		
		logChannel('Command: Get input with list --> ');
		
		const lines = getOutListFromCommand(`cd ${workspaceFolderPath} && global -c`);
		
		logChannel(`Command: Get input with list --> cd ${workspaceFolderPath} && global -c`);

		vscode.window.showQuickPick(lines).then((selectedItem: string | undefined) => {
			if (selectedItem) {

				logChannel(`Command: Get input with list --> ${selectedItem}`);
				
				mySymbolViewProvider.refresh(selectedItem.toString());
				myrefViewProvider.refresh(selectedItem.toString());
				myExtRefViewProvider.refresh(selectedItem.toString());
			}
		});

	});

	// Listen for the onDidChangeTextEditorSelection event
	vscode.window.onDidChangeTextEditorSelection(event => {

		let word = getWordAtCursor();
		
		logChannel(`Command: Cursor changed --> ${isSync} ${word}`);

		if (word && isSync)
		{
			console.log('On did change: ' + word);
			mySymbolViewProvider.refresh(word);
			myrefViewProvider.refresh(word);
			myExtRefViewProvider.refresh(word);
		}
	});

}

function getOutListFromCommand(command: string) {
	return execSync(command).toString().split('\n');
}

export function logChannel(msg: string) {
	channel.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`);
}