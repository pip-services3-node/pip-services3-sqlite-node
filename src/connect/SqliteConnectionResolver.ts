/** @module connect */
/** @hidden */
const async = require('async');
const url = require('url');

import { IReferenceable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { ConfigException } from 'pip-services3-commons-node';
import { ConnectionResolver } from 'pip-services3-components-node';
import { CredentialResolver } from 'pip-services3-components-node';
import { ConnectionParams } from 'pip-services3-components-node';
import { CredentialParams } from 'pip-services3-components-node';

/**
 * Helper class that resolves SQLite connection and credential parameters,
 * validates them and generates a connection URI.
 * 
 * It is able to process multiple connections to SQLite cluster nodes.
 * 
 *  ### Configuration parameters ###
 * 
 * - connection(s):    
 *   - discovery_key:             (optional) a key to retrieve the connection from [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]]
 *   - database:                  database file path
 *   - uri:                       resource URI with file:// protocol
 * 
 * ### References ###
 * 
 * - <code>\*:discovery:\*:\*:1.0</code>             (optional) [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code>      (optional) Credential stores to resolve credentials
 */
export class SqliteConnectionResolver implements IReferenceable, IConfigurable {
    /** 
     * The connections resolver.
     */
    protected _connectionResolver: ConnectionResolver = new ConnectionResolver();
    /** 
     * The credentials resolver.
     */
    protected _credentialResolver: CredentialResolver = new CredentialResolver();

    /**
     * Configures component by passing configuration parameters.
     * 
     * @param config    configuration parameters to be set.
     */
    public configure(config: ConfigParams): void {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);
    }

    /**
	 * Sets references to dependent components.
	 * 
	 * @param references 	references to locate the component dependencies. 
     */
    public setReferences(references: IReferences): void {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }
    
    private validateConnection(correlationId: string, connection: ConnectionParams): any {
        let uri = connection.getUri();
        if (uri != null) {
            if (!uri.startsWith("file://"))
                return new ConfigException(correlationId, "WRONG_PROTOCOL", "Connection protocol must be file://");
            return null;
        }

        // let host = connection.getHost();
        // if (host == null)
        //     return new ConfigException(correlationId, "NO_HOST", "Connection host is not set");

        // let port = connection.getPort();
        // if (port == 0)
        //     return new ConfigException(correlationId, "NO_PORT", "Connection port is not set");

        let database = connection.getAsNullableString("database");
        if (database == null)
            return new ConfigException(correlationId, "NO_DATABASE", "Connection database is not set");

        return null;
    }

    private validateConnections(correlationId: string, connections: ConnectionParams[]): any {
        if (connections == null || connections.length == 0)
            return new ConfigException(correlationId, "NO_CONNECTION", "Database connection is not set");

        for (let connection of connections) {
            let error = this.validateConnection(correlationId, connection);
            if (error) return error;
        }

        return null;
    }

    private composeConfig(connections: ConnectionParams[], credential: CredentialParams): any {
        let config: any = {};

        // Define connection part
        for (let connection of connections) {
            let uri = connection.getUri();
            if (uri) {
                // Removing file://
                config.database = uri.substring(7);
            }

            // let host = connection.getHost();
            // if (host) config.host = host;

            // let port = connection.getPort();
            // if (port) config.port = port;

            let database = connection.getAsNullableString("database");
            if (database) config.database = database;
        }

        // Define authentication part
        // if (credential) {
        //     let username = credential.getUsername();
        //     if (username) config.user = username;

        //     let password = credential.getPassword();
        //     if (password) config.password = password;
        // }

        return config;
    }

    /**
     * Resolves SQLite connection URI from connection and credential parameters.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives resolved config or error.
     */
    public resolve(correlationId: string, callback: (err: any, config: any) => void): void {
        let connections: ConnectionParams[];
        let credential: CredentialParams;

        async.parallel([
            (callback) => {
                this._connectionResolver.resolveAll(correlationId, (err: any, result: ConnectionParams[]) => {
                    connections = result;

                    // Validate connections
                    if (err == null)
                        err = this.validateConnections(correlationId, connections);

                    callback(err);
                });
            },
            (callback) => {
                this._credentialResolver.lookup(correlationId, (err: any, result: CredentialParams) => {
                    credential = result;

                    // Credentials are not validated right now

                    callback(err);
                });
            }
        ], (err) => {
            if (err)
                callback(err, null);
            else {
                let config = this.composeConfig(connections, credential);
                callback(null, config);
            }
        });
    }

}
