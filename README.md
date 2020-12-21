# <img src="https://uploads-ssl.webflow.com/5ea5d3315186cf5ec60c3ee4/5edf1c94ce4c859f2b188094_logo.svg" alt="Pip.Services Logo" width="200"> <br/> SQLite components for Node.js

This module is a part of the [Pip.Services](http://pipservices.org) polyglot microservices toolkit. It provides a set of components to implement SQLite persistence.

The module contains the following packages:
- **Build** - Factory to create SQLite persistence components.
- **Connect** - Connection component to configure SQLite connection to database.
- **Persistence** - abstract persistence components to perform basic CRUD operations.

<a name="links"></a> Quick links:

* [Configuration](https://www.pipservices.org/recipies/configuration) 
* [API Reference](https://pip-services3-node.github.io/pip-services3-sqlite-node/globals.html)
* [Change Log](CHANGELOG.md)
* [Get Help](https://www.pipservices.org/community/help)
* [Contribute](https://www.pipservices.org/community/contribute)

## Use

Install the NPM package as
```bash
npm install pip-services3-sqlite-node --save
```

As an example, lets create persistence for the following data object.

```typescript
import { IIdentifiable } from 'pip-services3-commons-node';

export class MyObject implements IIdentifiable {
  public id: string;
  public key: string;
  public value: number;
}
```

The persistence component shall implement the following interface with a basic set of CRUD operations.

```typescript
export interface IMyPersistence {
  getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
    callback: (err: any, page: DataPage<MyObject>) => void): void;
    
  getOneById(correlationId: string, id: string, callback: (err: any, item: MyObject) => void): void;
    
  getOneByKey(correlationId: string, key: string, callback: (err: any, item: MyObject) => void): void;
    
  create(correlationId: string, item: MyObject, callback?: (err: any, item: MyObject) => void): void;
    
  update(correlationId: string, item: MyObject, callback?: (err: any, item: MyObject) => void): void;
    
  deleteById(correlationId: string, id: string, callback?: (err: any, item: MyObject) => void): void;
}
```

To implement postgresql persistence component you shall inherit `IdentifiableSqlitePersistence`. 
Most CRUD operations will come from the base class. You only need to override `getPageByFilter` method with a custom filter function.
And implement a `getOneByKey` custom persistence method that doesn't exist in the base class.

```typescript
import { IdentifiableSqlitePersistence } from 'pip-services3-sqlite-node';

export class MySqlitePersistence extends IdentifableSqlitePersistence {
  public constructor() {
    super("myobjects");
    this.autoCreateObject("CREATE TABLE myobjects (id VARCHAR(32) PRIMARY KEY, key VARCHAR(50), value TEXT");
    this.ensureIndex("myobjects_key", { key: 1 }, { unique: true });
  }

  private composeFilter(filter: FilterParams): any {
    filter = filter || new FilterParams();
    
    let criteria = [];

    let id = filter.getAsNullableString('id');
    if (id != null)
        criteria.push("id='" + id + "'");

    let tempIds = filter.getAsNullableString("ids");
    if (tempIds != null) {
        let ids = tempIds.split(",");
        filters.push("id IN ('" + ids.join("','") + "')");
    }

    let key = filter.getAsNullableString("key");
    if (key != null)
        criteria.push("key='" + key + "'");

    return criteria.length > 0 ? criteria.join(" AND ") : null;
  }
  
  public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
    callback: (err: any, page: DataPage<MyObject>) => void): void {
    super.getPageByFilter(correlationId, this.composeFilter(filter), paging, "id", null, callback);
  }  
  
  public getOneByKey(correlationId: string, key: string,
    callback: (err: any, item: MyObject) => void): void {
    
    let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName) + " WHERE \"key\"=?";
    let params = [ key ];

    this._client.get(query, params, (err, result) => {
      err = err || null;

      if (item == null)
        this._logger.trace(correlationId, "Nothing found from %s with key = %s", this._tableName, key);
      else
        this._logger.trace(correlationId, "Retrieved from %s with key = %s", this._tableName, key);

      item = this.convertToPublic(item);
      callback(err, item);
    });
  }

}
```

Alternatively you can store data in non-relational format using `IdentificableJsonSqlitePersistence`.
It stores data in tables with two columns - `id` with unique object id and `data` with object data serialized as JSON.
To access data fields you shall use `JSON_EXTRACT(data, '$.field')` expression.

```typescript
import { IdentifiableJsonSqlitePersistence } from 'pip-services3-sqlite-node';

export class MySqlitePersistence extends IdentifableJsonSqlitePersistence {
  public constructor() {
    super("myobjects");
    this.ensureTable("VARCHAR(32)", "JSON");
    this.ensureIndex("myobjects_key", { "JSON_EXTRACT(data, '$.key')": 1 }, { unique: true });
  }

  private composeFilter(filter: FilterParams): any {
    filter = filter || new FilterParams();
    
    let criteria = [];

    let id = filter.getAsNullableString('id');
    if (id != null)
        criteria.push("JSON_EXTRACT(data, '$.id')='" + id + "'");

    let tempIds = filter.getAsNullableString("ids");
    if (tempIds != null) {
        let ids = tempIds.split(",");
        filters.push("JSON_EXTRACT(data, '$.id') IN ('" + ids.join("','") + "')");
    }

    let key = filter.getAsNullableString("key");
    if (key != null)
        criteria.push("JSON_EXTRACT(data, '$.key')='" + key + "'");

    return criteria.length > 0 ? criteria.join(" AND ") : null;
  }
  
  public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
    callback: (err: any, page: DataPage<MyObject>) => void): void {
    super.getPageByFilter(correlationId, this.composeFilter(filter), paging, "id", null, callback);
  }  
  
  public getOneByKey(correlationId: string, key: string,
    callback: (err: any, item: MyObject) => void): void {
    
    let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName) + " WHERE JSON_EXTRACT(data, '$.key')=?";
    let params = [ key ];

    this._client.get(query, params, (err, result) => {
      err = err || null;

      if (item == null)
        this._logger.trace(correlationId, "Nothing found from %s with key = %s", this._tableName, key);
      else
        this._logger.trace(correlationId, "Retrieved from %s with key = %s", this._tableName, key);

      item = this.convertToPublic(item);
      callback(err, item);
    });
  }

}
```

Configuration for your microservice that includes SQLite persistence may look the following way.

```yaml
...
{{#if SQLITE_ENABLED}}
- descriptor: pip-services:connection:postgres:con1:1.0
  connection:
    database: {{SQLITE_DB}}{{#unless SQLITE_DB}}./data/app.db{{/unless}}
    
- descriptor: myservice:persistence:postgres:default:1.0
  dependencies:
    connection: pip-services:connection:postgres:con1:1.0
  table: {{SQLITE_TABLE}}{{#unless SQLITE_TABLE}}myobjects{{/unless}}
{{/if}}
...
```

## Develop

For development you shall install the following prerequisites:
* Node.js 8+
* Visual Studio Code or another IDE of your choice
* Docker
* Typescript

Install dependencies:
```bash
npm install
```

Compile the code:
```bash
tsc
```

Run automated tests:
```bash
npm test
```

Generate API documentation:
```bash
./docgen.ps1
```

Before committing changes run dockerized build and test as:
```bash
./build.ps1
./test.ps1
./clear.ps1
```

## Contacts

The library is created and maintained by **Sergey Seroukhov**.

The documentation is written by **Mark Makarychev**.
