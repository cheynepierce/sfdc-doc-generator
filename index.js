#!/usr/bin/env node

var jsforce = require('jsforce');
var conn = new jsforce.Connection();

var MarkdownIt = require('markdown-it');
var md = new MarkdownIt();

var Promise = require('bluebird');
var fs = require('fs');
var readFile = Promise.promisify(require('fs').readFile);
var readdir = Promise.promisify(require('fs').readdir);
var statSync = Promise.promisify(require('fs').statSync);
var path = require('path');

var categorySObject = 'Category__c';
var articleSObject = 'Article__c';
var docdir = 'docs/';
var categoriesMap = {};
var articlesMap = {};

var categories = [];
var articles = [];

var username = '';
var password = '';

conn.login(username, password).then(function(userinfo) {
    return getCategories();
}).then(function(res) {
    categoriesMap = makeObjectMap(res.records);
    return getArticles();
}).then(function(res) {
    articlesMap = makeObjectMap(res.records);
    return readdir(docdir);
}).then(function(files) {
    // files.map(function(file) {
    //   return path.join(docdir, file);
    // }).filter(function(file) {
    //   return fs.statSync(file).isDirectory();
    // }).forEach(processDir);

    //upsertRecords(categorySObject, categories);

    files.map(function(file) {
        return path.join(docdir, file);
    }).filter(function(file) {
        return fs.statSync(file).isFile();
    }).forEach(processFile);
});

function getCategories() {
    return conn.query("SELECT Id, Name FROM " + categorySObject);
}

function getArticles() {
    return conn.query("SELECT Id, Name FROM " + articleSObject);
}

function processFile(file, index) {
    readFile(file, 'utf8').then(function(data) {
        return md.render(data);
    }).then(function(html) {
        upsertRecords(articleSObject, [createObject(file, html)]);
    });
}

function upsertRecords(sObjectType, records) {
    var recordsToInsert = [];
    var recordsToUpdate = [];

    for (var i=0; i<records.length; i++) {
        if ('Id' in records[i]) {
            recordsToUpdate.push(records[i]);
        } else {
            recordsToInsert.push(records[i]);
        }
    }

    conn.sobject(sObjectType)
        .create(recordsToInsert)
        .then(handleDmlResult)
        .catch(handleDmlError);

    conn.sobject(sObjectType)
        .update(recordsToUpdate)
        .then(handleDmlResult)
        .catch(handleDmlError);
}

function handleDmlResult(res) {
    for (var i=0; i<res.length; i++) {
        console.log(res[i]);
        if (res[i].success == true) {
            console.log('record upserted: ' + res[i].id);
        } else {
            console.log(res[i].errors);
        }
    }
}

function handleDmlError(error) {
    console.log(error);
}

function makeObjectMap(records) {
    var m = {};
    for (var i=0; i<records.length; i++) {
      var record = records[i];
      m[record.Name] = record.Id;
    }
    return m;
}

function createObject(file, html) {
    var articleName = getName(file);
    var articleId = getArticleId(articleName);
    var categoryId = getCategoryId(file);

    var article = {
      Name: articleName,
      Category__c: categoryId,
      Content__c: html
    };

    if (articleId != null) {
      article.Id = articleId;
    }

    return article;
}

function getName(file) {
    return path.basename(file).split('.')[0];
}

function getArticleId(articleName) {
    if (articleName in articlesMap) {
        return articlesMap[articleName];
    }
    return null;
}

function getCategoryId(file) {
    var dirname = path.dirname(file).split(path.sep).slice(-1)[0];
    if (dirname in categoriesMap) {
      return categoriesMap[dirname];
    }
    return null;
}
