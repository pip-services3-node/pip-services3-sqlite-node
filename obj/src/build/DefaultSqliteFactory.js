"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultSqliteFactory = void 0;
/** @module build */
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const SqliteConnection_1 = require("../persistence/SqliteConnection");
/**
 * Creates Sqlite components by their descriptors.
 *
 * @see [[https://pip-services3-node.github.io/pip-services3-components-node/classes/build.factory.html Factory]]
 * @see [[SqliteConnection]]
 */
class DefaultSqliteFactory extends pip_services3_components_node_1.Factory {
    /**
     * Create a new instance of the factory.
     */
    constructor() {
        super();
        this.registerAsType(DefaultSqliteFactory.SqliteConnectionDescriptor, SqliteConnection_1.SqliteConnection);
    }
}
exports.DefaultSqliteFactory = DefaultSqliteFactory;
DefaultSqliteFactory.Descriptor = new pip_services3_commons_node_1.Descriptor("pip-services", "factory", "sqlite", "default", "1.0");
DefaultSqliteFactory.SqliteConnectionDescriptor = new pip_services3_commons_node_1.Descriptor("pip-services", "connection", "sqlite", "*", "1.0");
//# sourceMappingURL=DefaultSqliteFactory.js.map