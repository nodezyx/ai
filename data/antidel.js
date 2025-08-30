const { DATABASE } = require('../lib/database');
const { DataTypes } = require('sequelize');
const config = require('../config');

const AntiDelDB = DATABASE.define('AntiDelete', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        defaultValue: 1,
    },
    gc_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: config.ANTIDELETE?.gc || false,
    },
    dm_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: config.ANTIDELETE?.dm || false,
    },
    status_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: config.ANTIDELETE?.status || false,
    },
}, {
    tableName: 'antidelete',
    timestamps: false,
    hooks: {
        beforeCreate: record => { record.id = 1; },
        beforeBulkCreate: records => { records.forEach(record => { record.id = 1; }); },
    },
});

let isInitialized = false;

async function initializeAntiDeleteSettings() {
    if (isInitialized) return;
    try {
        // First sync the model to ensure table exists
        await AntiDelDB.sync();
        
        // Check if record exists
        const record = await AntiDelDB.findByPk(1);
        if (!record) {
            // Create new record with default values
            await AntiDelDB.create({ 
                id: 1, 
                gc_status: config.ANTIDELETE?.gc || false,
                dm_status: config.ANTIDELETE?.dm || false,
                status_status: config.ANTIDELETE?.status || false
            });
        }
        isInitialized = true;
        console.log('AntiDelete settings initialized successfully');
    } catch (error) {
        console.error('Error initializing anti-delete settings:', error);
        // If table doesn't exist at all, create it
        if (error.original && error.original.code === 'SQLITE_ERROR' && error.original.message.includes('no such table')) {
            await AntiDelDB.sync();
            await AntiDelDB.create({ 
                id: 1, 
                gc_status: config.ANTIDELETE?.gc || false,
                dm_status: config.ANTIDELETE?.dm || false,
                status_status: config.ANTIDELETE?.status || false
            });
            isInitialized = true;
            console.log('AntiDelete table created successfully');
        }
    }
}

async function setAnti(type, status) {
    try {
        await initializeAntiDeleteSettings();
        const updateData = {};
        updateData[`${type}_status`] = status;
        
        const [affectedRows] = await AntiDelDB.update(updateData, { where: { id: 1 } });
        console.log(`AntiDelete ${type} set to: ${status}, affected rows: ${affectedRows}`);
        return affectedRows > 0;
    } catch (error) {
        console.error('Error setting anti-delete status:', error);
        return false;
    }
}

async function getAnti(type) {
    try {
        await initializeAntiDeleteSettings();
        const record = await AntiDelDB.findByPk(1);
        if (!record) {
            console.log('No anti-delete record found, using defaults');
            return false;
        }
        
        const status = record[`${type}_status`];
        console.log(`AntiDelete ${type} status: ${status}`);
        return status;
    } catch (error) {
        console.error('Error getting anti-delete status:', error);
        return false;
    }
}

// Add this function to get all status at once
async function getAllAnti() {
    try {
        await initializeAntiDeleteSettings();
        const record = await AntiDelDB.findByPk(1);
        if (!record) {
            return {
                gc: config.ANTIDELETE?.gc || false,
                dm: config.ANTIDELETE?.dm || false,
                status: config.ANTIDELETE?.status || false
            };
        }
        
        return {
            gc: record.gc_status,
            dm: record.dm_status,
            status: record.status_status
        };
    } catch (error) {
        console.error('Error getting all anti-delete status:', error);
        return {
            gc: config.ANTIDELETE?.gc || false,
            dm: config.ANTIDELETE?.dm || false,
            status: config.ANTIDELETE?.status || false
        };
    }
}

module.exports = {
    AntiDelDB,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
    getAllAnti
};
