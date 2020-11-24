/** @module build */
import { Factory } from 'pip-services3-components-node';
import { Descriptor } from 'pip-services3-commons-node';

import { SqliteConnection } from '../persistence/SqliteConnection';

/**
 * Creates Sqlite components by their descriptors.
 * 
 * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/classes/build.factory.html Factory]]
 * @see [[SqliteConnection]]
 */
export class DefaultSqliteFactory extends Factory {
	public static readonly Descriptor: Descriptor = new Descriptor("pip-services", "factory", "sqlite", "default", "1.0");
    public static readonly SqliteConnectionDescriptor: Descriptor = new Descriptor("pip-services", "connection", "sqlite", "*", "1.0");

    /**
	 * Create a new instance of the factory.
	 */
    public constructor() {
        super();
        this.registerAsType(DefaultSqliteFactory.SqliteConnectionDescriptor, SqliteConnection);
    }
}
