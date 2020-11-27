import { AnyValueMap } from 'pip-services3-commons-node';
import { IIdentifiable } from 'pip-services3-commons-node';
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
 *   - discovery_key:             (optional) a key to retrieve the connection from [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]]
 *   - database:                  database file path
 *   - uri:                       resource URI with file:// protocol
 *
 * ### References ###
 *
 * - <code>\*:logger:\*:\*:1.0</code>           (optional) [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/log.ilogger.html ILogger]] components to pass log messages components to pass log messages
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code> (optional) Credential stores to resolve credentials
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
export declare class IdentifiableSqlitePersistence<T extends IIdentifiable<K>, K> extends SqlitePersistence<T> implements IWriter<T, K>, IGetter<T, K>, ISetter<T> {
    /**
     * Creates a new instance of the persistence component.
     *
     * @param collection    (optional) a collection name.
     */
    constructor(tableName: string);
    /**
     * Converts the given object from the public partial format.
     *
     * @param value     the object to convert from the public partial format.
     * @returns the initial object.
     */
    protected convertFromPublicPartial(value: any): any;
    /**
     * Gets a list of data items retrieved by given unique ids.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param ids               ids of data items to be retrieved
     * @param callback         callback function that receives a data list or error.
     */
    getListByIds(correlationId: string, ids: K[], callback: (err: any, items: T[]) => void): void;
    /**
     * Gets a data item by its unique id.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param id                an id of data item to be retrieved.
     * @param callback          callback function that receives data item or error.
     */
    getOneById(correlationId: string, id: K, callback: (err: any, item: T) => void): void;
    /**
     * Creates a data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              an item to be created.
     * @param callback          (optional) callback function that receives created item or error.
     */
    create(correlationId: string, item: T, callback?: (err: any, item: T) => void): void;
    /**
     * Sets a data item. If the data item exists it updates it,
     * otherwise it create a new data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              a item to be set.
     * @param callback          (optional) callback function that receives updated item or error.
     */
    set(correlationId: string, item: T, callback?: (err: any, item: T) => void): void;
    /**
     * Updates a data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              an item to be updated.
     * @param callback          (optional) callback function that receives updated item or error.
     */
    update(correlationId: string, item: T, callback?: (err: any, item: T) => void): void;
    /**
     * Updates only few selected fields in a data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param id                an id of data item to be updated.
     * @param data              a map with fields to be updated.
     * @param callback          callback function that receives updated item or error.
     */
    updatePartially(correlationId: string, id: K, data: AnyValueMap, callback?: (err: any, item: T) => void): void;
    /**
     * Deleted a data item by it's unique id.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param id                an id of the item to be deleted
     * @param callback          (optional) callback function that receives deleted item or error.
     */
    deleteById(correlationId: string, id: K, callback?: (err: any, item: T) => void): void;
    /**
     * Deletes multiple data items by their unique ids.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param ids               ids of data items to be deleted.
     * @param callback          (optional) callback function that receives error or null for success.
     */
    deleteByIds(correlationId: string, ids: K[], callback?: (err: any) => void): void;
}
