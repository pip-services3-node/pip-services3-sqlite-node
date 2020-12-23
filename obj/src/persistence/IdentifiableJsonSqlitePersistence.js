"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifiableJsonSqlitePersistence = void 0;
/** @module persistence */
/** @hidden */
const _ = require('lodash');
const IdentifiableSqlitePersistence_1 = require("./IdentifiableSqlitePersistence");
/**
 * Abstract persistence component that stores data in SQLite in JSON or JSONB fields
 * and implements a number of CRUD operations over data items with unique ids.
 * The data items must implement [[https://pip-services3-node.github.io/pip-services3-commons-node/interfaces/data.iidentifiable.html IIdentifiable]] interface.
 *
 * The JSON table has only two fields: id and data.
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
 * - <code>\*:credential-store:\*:\*:1.0</code> (optional) Credential stores to resolve credentials
 *
 * ### Example ###
 *
 *     class MySqlitePersistence extends IdentifiableSqliteJsonPersistence<MyData, string> {
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
 *             criteria.push("JSON_EXTRACT(data,'$.name')='" + name + "'");
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
class IdentifiableJsonSqlitePersistence extends IdentifiableSqlitePersistence_1.IdentifiableSqlitePersistence {
    /**
     * Creates a new instance of the persistence component.
     *
     * @param collection    (optional) a collection name.
     */
    constructor(tableName) {
        super(tableName);
    }
    /**
     * Adds DML statement to automatically create JSON(B) table
     *
     * @param idType type of the id column (default: VARCHAR(32))
     * @param dataType type of the data column (default: JSON)
     */
    ensureTable(idType = 'VARCHAR(32)', dataType = 'JSON') {
        let query = "CREATE TABLE IF NOT EXISTS " + this.quoteIdentifier(this._tableName)
            + " (id " + idType + " PRIMARY KEY, data " + dataType + ")";
        this.autoCreateObject(query);
    }
    /**
     * Converts object value from internal to public format.
     *
     * @param value     an object in internal format to convert.
     * @returns converted object in public format.
     */
    convertToPublic(value) {
        if (value == null)
            return null;
        return JSON.parse(value.data);
    }
    /**
     * Convert object value from public to internal format.
     *
     * @param value     an object in public format to convert.
     * @returns converted object in internal format.
     */
    convertFromPublic(value) {
        if (value == null)
            return null;
        let result = {
            id: value.id,
            data: JSON.stringify(value)
        };
        return result;
    }
    /**
     * Updates only few selected fields in a data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param id                an id of data item to be updated.
     * @param data              a map with fields to be updated.
     * @param callback          callback function that receives updated item or error.
     */
    updatePartially(correlationId, id, data, callback) {
        if (data == null || id == null) {
            if (callback)
                callback(null, null);
            return;
        }
        // let row = this.convertFromPublicPartial(data.getAsObject());
        let values = [JSON.stringify(data.getAsObject()), id];
        let query = "UPDATE " + this.quoteIdentifier(this._tableName) + " SET data=JSON_PATCH(data,?) WHERE id=?";
        this._client.serialize(() => {
            this._client.run(query, values, (err, result) => {
                if (!err)
                    this._logger.trace(correlationId, "Updated partially in %s with id = %s", this._tableName, id);
                let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName) + " WHERE id=?";
                this._client.get(query, [id], (err, result) => {
                    err = err || null;
                    result = result || null;
                    let newItem = result ? this.convertToPublic(result) : null;
                    if (callback)
                        callback(err, newItem);
                });
            });
        });
    }
}
exports.IdentifiableJsonSqlitePersistence = IdentifiableJsonSqlitePersistence;
//# sourceMappingURL=IdentifiableJsonSqlitePersistence.js.map