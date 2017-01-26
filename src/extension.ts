'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // This line of code will only be executed once when your extension is activated
    console.log('package activated')

    let helloSayer = vscode.commands.registerCommand('extension.sayHello', () => {
        console.log('Hello World!')
        vscode.window.showInformationMessage('Hello World!');
        // vscode.window.showQuickPick(['Hello', 'World']);
    });

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(helloSayer);

    let selectionCounter = vscode.commands.registerCommand('extension.countSelection', () => {
        var editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        var selection = editor.selection;
        var text = editor.document.getText(selection);

        vscode.window.showInformationMessage('Selected characters: ' + text.length);
    });

    context.subscriptions.push(selectionCounter);

    let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);
    
    var counterOfWords = vscode.commands.registerCommand('extension.wordCounter', () => {
        wordCounter.updateWordCount();
    })

    context.subscriptions.push(controller);
    context.subscriptions.push(wordCounter);
    context.subscriptions.push(counterOfWords);
}

class WordCounter {
    private _statusBarItem: StatusBarItem;

    public updateWordCount() {
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        let doc = editor.document;
        if (doc.languageId === 'markdown') {
            let wordCount = this._getWordCount(doc);

            this._statusBarItem.text = wordCount !== 1 ? `$(pencil) ${wordCount} Words` : '$(pencil) 1 Word';
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    public _getWordCount(doc: TextDocument): number {
        let docContent = doc.getText();

        // Parse out unwanted whitespace so the split is accurate
        docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
        docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        let wordCount = 0;
        if (docContent != "") {
            wordCount = docContent.split(' ').length;
        }

        return wordCount;
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}

class WordCounterController {
    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.updateWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        this._wordCounter.updateWordCount();

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    public _onEvent() {
        this._wordCounter.updateWordCount();
    }
}