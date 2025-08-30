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
        }
    }
}

async function setAnti(type, status) {
    try {
        await initializeAntiDeleteSettings();
        const updateData = {};
        updateData[`${type}_status`] = status;
        
        const [affectedRows] = await AntiDelDB.update(updateData, { where: { id: 1 } });
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
        if (!record) return false;
        
        return record[`${type}_status`];
    } catch (error) {
        console.error('Error getting anti-delete status:', error);
        return false;
    }
}

module.exports = {
    AntiDelDB,
    initializeAntiDeleteSettings,
    setAnti,
    getAnti,
};
