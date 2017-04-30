# SFDC Doc Generator

Doc Generator is a command line app for creating Salesforce Article__c records from markdown files. It uses [markdown-it](https://github.com/markdown-it/markdown-it) to convert the file content to HTML before storing it in a rich text field. This app is meant to be used with the [Salesforce Documentation App](https://github.com/cheynepierce/sfdc-documentation-app) in order to make Salesforce documentation, written using markdown and included in your source code repository, easily accessible to Salesforce end users.

## Installation

To install the doc generator, run

```
npm install -g
```

## Usage

Currently, the app contains variables for Salesforce username, password, and article directory name. The app will look in the doc directory for the article files. To run the app, change into the directory that contains the docs directory, and then run

```
generateDocs
```

*Future state: the app will ask for user input for username, password, and article directory.*
