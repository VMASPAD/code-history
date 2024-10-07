import * as vscode from 'vscode';

let copyHistory: string[] = [];

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "copy-history" is now active!');

    const copyHistoryProvider = new CopyHistoryProvider();
    vscode.window.registerTreeDataProvider('copyHistoryView', copyHistoryProvider);

    vscode.commands.registerCommand('copy-history.clearHistory', () => {
        copyHistory = [];
        copyHistoryProvider.refresh();
    });

    vscode.commands.registerCommand('copy-history.captureCopy', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            if (text) {
                copyHistory.push(text);
                copyHistoryProvider.refresh();
            }
        }
    });

    vscode.commands.registerCommand('copy-history.copyItem', (item: CopyItem) => {
        vscode.env.clipboard.writeText(item.text);
        vscode.window.showInformationMessage(`Copied: ${item.text}`);
    });

    vscode.commands.registerCommand('copy-history.deleteItem', (item: CopyItem) => {
        copyHistory = copyHistory.filter((_, index) => index !== item.index);
        copyHistoryProvider.refresh();
    });

    context.subscriptions.push(vscode.commands.registerCommand('copy-history.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Copy History!');
    }));

    // Bind the copy command to our custom command
    vscode.commands.registerCommand('editor.action.clipboardCopyAction', () => {
        vscode.commands.executeCommand('copy-history.captureCopy');
    });
}

export function deactivate() {}

class CopyHistoryProvider implements vscode.TreeDataProvider<CopyItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CopyItem | undefined | void> = new vscode.EventEmitter<CopyItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<CopyItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CopyItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CopyItem): Thenable<CopyItem[]> {
        return Promise.resolve(this.getCopyItems());
    }

    private getCopyItems(): CopyItem[] {
        return copyHistory.map((text, index) => new CopyItem(text, index));
    }
}

class CopyItem extends vscode.TreeItem {
    constructor(
        public readonly text: string,
        public readonly index: number
    ) {
        super(text, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${this.text}`;
        this.description = this.text;
        this.contextValue = 'copyItem';
        this.iconPath = {
            light: vscode.Uri.file(__dirname + '/resources/light/default-icon.svg'),
            dark: vscode.Uri.file(__dirname + '/resources/dark/default-icon.svg')
        };
    }
}