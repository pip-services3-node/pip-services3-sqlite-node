# <img src="https://uploads-ssl.webflow.com/5ea5d3315186cf5ec60c3ee4/5edf1c94ce4c859f2b188094_logo.svg" alt="Pip.Services Logo" width="200"> <br/> SQLite components for Node.js Changelog

## <a name="3.1.0"></a> 3.1.0 (2021-02-18) 

### Features
* Renamed autoCreateObject to ensureSchema
* Added defineSchema method that shall be overriden in child classes
* Added clearSchema method

### Breaking changes
* Method autoCreateObject is deprecated and shall be renamed to ensureSchema

## <a name="3.0.0"></a> 3.0.0 (2020-11-23) 

Initial public release

### Features

* Added SqliteConnectionResolver
* Added SqliteConnection
* Added SqlitePersistence
* Added IdentifiableSqlitePersistence
* Added IdentifiableJsonßSqlitePersistence

