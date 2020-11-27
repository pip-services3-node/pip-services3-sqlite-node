/** @module persistence */
/** @hidden */
const _ = require('lodash');

import { AnyValueMap } from 'pip-services3-commons-node';
import { IIdentifiable } from 'pip-services3-commons-node';
import { IdGenerator } from 'pip-services3-commons-node';

import { IWriter } from 'pip-services3-data-node';
import { IGetter } from 'pip-services3-data-node';
import { ISetter } from 'pip-services3-data-node';

import { SqlitePersistence } from './SqlitePersistence';

/**
 * Abstract persistence component that stores data in SQLite
 * and implements a number of CRUD operations over data items with unique ids.
 * The data items must implement [[https://pip-services3-node.github.io/pip-services3-commons-node/interfaces/data.iidentifiable.html IIdentifiable]] interface.
 * 
 * In basic scenarios child classes shall only override [[getPageByFilter]],
 * [[getListByFilter]] or [[deleteByFilter]] operations with specific filter function.
 * All other operations can be used out of the box. 
 * 
 * In complex scenarios child classes can implement additional operations by 
 * accessing <code>this._collection</code> and <code>this._model</code> properties.

 * ### Configuration parameters ###
 * 
 * - collection:                  (optional) SQLite table name
 * - connection(s):    
 *   - discovery_key:             (optional) a key to retrieve the connection from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]]
 *   - database:                  database file path
 *   - uri:                       resource URI with file:// protocol
 * 
 * ### References ###
 * 
 * - <code>\*:logger:\*:\*:1.0</code>           (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/log.ilogger.html ILogger]] components to pass log messages components to pass log messages
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code> (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/auth.icredentialstore.html Credential stores]] to resolve credentials
 * 
 * ### Example ###
 * 
 *     class MySqlitePersistence extends IdentifiableSqlitePersistence<MyData, string> {
 *    
 *     public constructor() {
 *         super("mydata");
 *     }
 * 
 *     private composeFilter(filter: FilterParams): any {
 *         filter = filter || new FilterParams();
 *         let criteria = [];
 *         let name = filter.getAsNullableString('name');
 *         if (name != null)
 *             criteria.push("name='" + name + "'");
 *         return criteria.length > 0 ? criteria.join(" AND ") : null;
 *     }
 * 
 *     public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
 *         callback: (err: any, page: DataPage<MyData>) => void): void {
 *         base.getPageByFilter(correlationId, this.composeFilter(filter), paging, null, null, callback);
 *     }
 * 
 *     }
 * 
 *     let persistence = new MySqlitePersistence();
 *     persistence.configure(ConfigParams.fromTuples(
 *         "connection.database", "./data/mydb.db"
 *     ));
 * 
 *     persitence.open("123", (err) => {
 *         ...
 *     });
 * 
 *     persistence.create("123", { id: "1", name: "ABC" }, (err, item) => {
 *         persistence.getPageByFilter(
 *             "123",
 *             FilterParams.fromTuples("name", "ABC"),
 *             null,
 *             (err, page) => {
 *                 console.log(page.data);          // Result: { id: "1", name: "ABC" }
 * 
 *                 persistence.deleteById("123", "1", (err, item) => {
 *                    ...
 *                 });
 *             }
 *         )
 *     });
 */
export class IdentifiableSqlitePersistence<T extends IIdentifiable<K>, K> extends SqlitePersistence<T>
    implements IWriter<T, K>, IGetter<T, K>, ISetter<T> {

    /**
     * Creates a new instance of the persistence component.
     * 
     * @param collection    (optional) a collection name.
     */
    public constructor(tableName: string) {
        super(tableName);

        if (tableName == null)
            throw new Error("Table name could not be null");
    }

    /** 
     * Converts the given object from the public partial format.
     * 
     * @param value     the object to convert from the public partial format.
     * @returns the initial object.
     */
    protected convertFromPublicPartial(value: any): any {
        return this.convertFromPublic(value);
    }    
    
    /**
     * Gets a list of data items retrieved by given unique ids.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param ids               ids of data items to be retrieved
     * @param callback         callback function that receives a data list or error.
     */
    public getListByIds(correlationId: string, ids: K[],
        callback: (err: any, items: T[]) => void): void {

        let params = this.generateParameters(ids);
        let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName) + " WHERE id IN(" + params + ")";

        this._client.all(query, ids, (err, result) => {
            err = err || null;
            if (err) {
                callback(err, null);
                return;
            }

            let items = result;

            if (items != null)
                this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._tableName);
                
            items = _.map(items, this.convertToPublic);
            callback(null, items);
        });
    }

    /**
     * Gets a data item by its unique id.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param id                an id of data item to be retrieved.
     * @param callback          callback function that receives data item or error.
     */
    public getOneById(correlationId: string, id: K, callback: (err: any, item: T) => void): void {
        let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName) + " WHERE id=?";
        let params = [ id ];

        this._client.get(query, params, (err, result) => {
            err = err || null;

            let item = result || null; 

            if (item == null)
                this._logger.trace(correlationId, "Nothing found from %s with id = %s", this._tableName, id);
            else
                this._logger.trace(correlationId, "Retrieved from %s with id = %s", this._tableName, id);

            item = this.convertToPublic(item);
            callback(err, item);
        });
    }

    /**
     * Creates a data item.
     * 
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              an item to be created.
     * @param callback          (optional) callback function that receives created item or error.
     */
    public create(correlationId: string, item: T, callback?: (err: any, item: T) => void): void {
        if (item == null) {
            callback(null, null);
            return;
        }

        // Assign unique id
        let newItem: any = item;
        if (newItem.id == null) {
            newItem = _.clone(newItem);
            newItem.id = item.id || IdGenerator.nextLong();
        }

        super.create(correlationId, newItem, callback);
    }

    /**
     * Sets a data item. If the data item exists it updates it,
     * otherwise it create a new data item.
     * 
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              a item to be set.
     * @param callback          (optional) callback function that receives updated item or error.
     */
    public set(correlationId: string, item: T, callback?: (err: any, item: T) => void): void {
        if (item == null) {
            if (callback) callback(null, null);
            return;
        }

        // Assign unique id
        if (item.id == null) {
            item = _.clone(item);
            item.id = <any>IdGenerator.nextLong();
        }

        let row = this.convertFromPublic(item);
        let columns = this.generateColumns(row);
        let params = this.generateParameters(row);
        let setParams = this.generateSetParameters(row);
        let values = this.generateValues(row);
        values.push(...values);

        let query = "INSERT INTO " + this.quoteIdentifier(this._tableName) + " (" + columns + ") VALUES (" + params + ")";
        query += " ON CONFLICT(id) DO UPDATE SET " + setParams;

        this._client.serialize(() => {
            this._client.run(query, values, (err, result) => {
                err = err || null;

                if (!err)
                    this._logger.trace(correlationId, "Set in %s with id = %s", this.quoteIdentifier(this._tableName), item.id);
                
                let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName) + " WHERE id=?";
                this._client.get(query, [item.id], (err, result) => {
                    err = err || null;
                    result = result || null;

                    let newItem = result ? this.convertToPublic(result) : null;
        
                    if (callback) callback(err, newItem);
                });
            });
        });
    }

    /**
     * Updates a data item.
     * 
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              an item to be updated.
     * @param callback          (optional) callback function that receives updated item or error.
     */
    public update(correlationId: string, item: T, callback?: (err: any, item: T) => void): void {
        if (item == null || item.id == null) {
            if (callback) callback(null, null);
            return;
        }

        let row = this.convertFromPublic(item);
        let params = this.generateSetParameters(row);
        let values = this.generateValues(row);
        values.push(item.id);

        let query = "UPDATE " + this.quoteIdentifier(this._tableName) + " SET " + params + " WHERE id=?";

        this._client.serialize(() => {
            this._client.run(query, values, (err, result) => {
                if (!err)
                    this._logger.trace(correlationId, "Updated in %s with id = %s", this._tableName, item.id);

                let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName) + " WHERE id=?";
                this._client.get(query, [item.id], (err, result) => {
                    err = err || null;
                    result = result || null;

                    let newItem = result ? this.convertToPublic(result) : null;
        
                    if (callback) callback(err, newItem);
                });
            });    
        });
    }

    /**
     * Updates only few selected fields in a data item.
     * 
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param id                an id of data item to be updated.
     * @param data              a map with fields to be updated.
     * @param callback          callback function that receives updated item or error.
     */
    public updatePartially(correlationId: string, id: K, data: AnyValueMap,
        callback?: (err: any, item: T) => void): void {
            
        if (data == null || id == null) {
            if (callback) callback(null, null);
            return;
        }

        let row = this.convertFromPublicPartial(data.getAsObject());
        let params = this.generateSetParameters(row);
        let values = this.generateValues(row);
        values.push(id);

        let query = "UPDATE " + this.quoteIdentifier(this._tableName) + " SET " + params + " WHERE id=?";

        this._client.serialize(() => {
            this._client.run(query, values, (err, result) => {
                if (!err)
                    this._logger.trace(correlationId, "Updated partially in %s with id = %s", this._tableName, id);

                let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName) + " WHERE id=?";
                this._client.get(query, [id], (err, result) => {
                    err = err || null;
                    result = result || null;
        
                    let newItem = result ? this.convertToPublic(result) : null;
        
                    if (callback) callback(err, newItem);
                });
            });    
        });
    }

    /**
     * Deleted a data item by it's unique id.
     * 
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param id                an id of the item to be deleted
     * @param callback          (optional) callback function that receives deleted item or error.
     */
    public deleteById(correlationId: string, id: K, callback?: (err: any, item: T) => void): void {
        let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName) + " WHERE id=?"

        this._client.serialize(() => {
            this._client.get(query, [ id ], (err, result) => {
                err = err || null;
    
                let newItem = result ? this.convertToPublic(result) : null;

                // Skip if there is nothing to delete
                if (newItem == null) {
                    if (callback) callback(err, newItem);
                    return;
                }
    
                let query = "DELETE FROM " + this.quoteIdentifier(this._tableName) + " WHERE id=?";
                this._client.run(query, [ id ], (err, result) => {
                    err = err || null;
                    result = result || null;

                    if (!err)
                        this._logger.trace(correlationId, "Deleted from %s with id = %s", this._tableName, id);
                
                    if (callback) callback(err, newItem);
                });
            });
        });
    }

    /**
     * Deletes multiple data items by their unique ids.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param ids               ids of data items to be deleted.
     * @param callback          (optional) callback function that receives error or null for success.
     */
    public deleteByIds(correlationId: string, ids: K[], callback?: (err: any) => void): void {
        let params = this.generateParameters(ids);
        let query = "DELETE FROM " + this.quoteIdentifier(this._tableName) + " WHERE id IN(" + params + ")";

        this._client.run(query, ids, (err, result) => {
            let count = 0; //result ? result.affectedRows : 0;

            err = err || null;
            if (!err)
                this._logger.trace(correlationId, "Deleted %d items from %s", count, this._tableName);

            if (callback) callback(err);
        });
    }
}
