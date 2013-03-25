exports.CategoryRepository = function (baseRepo) {
    'use strict';

    var collection = baseRepo.getCollection(),
        val = require('bbvalid'),
        schema = {
            'properties': {
                '_id': {
                    'type': 'string',
                    'required': false
                },
                'catName': {
                    'type': 'string',
                    'required': true
                },
                'created': {
                    'type': 'string',
                    'required': true,
                    'format': 'dateTime'
                },
                'description': {
                    'type': 'string',
                    'required': true
                }
            }
        };

    collection.ensureIndex({'catName': 1}, {unique: true}, function (error) {
        if (error) {
            console.error(error);
        }
    });

    baseRepo.setDefaultSortField('catName');

    // validators
    baseRepo.checkCatName = function (catName, cb) {
        collection.findOne({catName: catName}, function (err, res) {

            if (err) {
                cb(err);
            } else if (res) {
                cb(null, {valid: false, errors: [
                    {attribute: 'checkCatName',
                        property: 'catName', expected: false, actual: true,
                        message: 'catName already exists'}
                ]});
            }
            else {
                cb(null, {valid: true});
            }
        });
    };

    baseRepo.getSchema = function () {
        return schema;
    };

    baseRepo.validate = function (doc, isUpdate, schema, cb) {

        var catNameCheck = true;

        // check is update
        if (isUpdate) {

            for (var schemaProp in schema.properties) {
                if (schema.properties.hasOwnProperty(schemaProp)) {
                    if (!doc.hasOwnProperty(schemaProp)) {
                        schema.properties[schemaProp].required = false;
                    }
                }
            }

            if (!doc.hasOwnProperty('catName')) {
                catNameCheck = false;
            }
        }

        // json schema validate
        var valResult = val.validate(doc, schema);

        // register async validator
        if (catNameCheck) {
            val.asyncValidate.register(baseRepo.checkCatName, doc.catName);
        }

        // async validate
        val.asyncValidate.exec(valResult, cb);
    };

    baseRepo.convert = function (doc) {
        if (doc.hasOwnProperty('created') &&  typeof doc.created === 'string') {
            doc.created = new Date(doc.created);
        }

        return doc;
    };

    return baseRepo;
};
