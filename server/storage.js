var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { db } from "./firebase-admin"; // Ensure Firestore import
import { Timestamp } from "firebase-admin/firestore";
// Define Firestore collections
var usersCollection = db.collection("users");
var propertiesCollection = db.collection("properties");
var inquiriesCollection = db.collection("inquiries");
// Fetch all users
export var getAllUsers = function () { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, usersCollection.get()];
            case 1:
                snapshot = _a.sent();
                return [2 /*return*/, snapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })];
        }
    });
}); };
// Get a single user by ID
export var getUserById = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var docRef, userDoc;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                docRef = usersCollection.doc(id);
                return [4 /*yield*/, docRef.get()];
            case 1:
                userDoc = _a.sent();
                return [2 /*return*/, userDoc.exists ? __assign({ id: userDoc.id }, userDoc.data()) : null];
        }
    });
}); };
// Add a new user
export var addUser = function (user) { return __awaiter(void 0, void 0, void 0, function () {
    var newUserRef;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, usersCollection.add(user)];
            case 1:
                newUserRef = _a.sent();
                return [2 /*return*/, __assign({ id: newUserRef.id }, user)];
        }
    });
}); };
// Update an existing user
export var updateUser = function (id, userData) { return __awaiter(void 0, void 0, void 0, function () {
    var docRef;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                docRef = usersCollection.doc(id);
                return [4 /*yield*/, docRef.set(userData, { merge: true })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Delete a user
export var deleteUser = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var docRef;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                docRef = usersCollection.doc(id);
                return [4 /*yield*/, docRef.delete()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Fetch all properties
export var getAllProperties = function () { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, propertiesCollection.get()];
            case 1:
                snapshot = _a.sent();
                return [2 /*return*/, snapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })];
        }
    });
}); };
// Get a single property by ID
export var getPropertyById = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var docRef, propertyDoc;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                docRef = propertiesCollection.doc(id);
                return [4 /*yield*/, docRef.get()];
            case 1:
                propertyDoc = _a.sent();
                return [2 /*return*/, propertyDoc.exists
                        ? __assign({ id: propertyDoc.id }, propertyDoc.data()) : null];
        }
    });
}); };
// Get featured properties
export var getFeaturedProperties = function () { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, propertiesCollection
                    .where("featured", "==", true)
                    .get()];
            case 1:
                snapshot = _a.sent();
                return [2 /*return*/, snapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })];
        }
    });
}); };
// Add a new property
export var addProperty = function (property) { return __awaiter(void 0, void 0, void 0, function () {
    var propertyData, newPropertyRef;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                propertyData = __assign(__assign({}, property), { bedrooms: Array.isArray(property.bedrooms) ? property.bedrooms : [] });
                return [4 /*yield*/, propertiesCollection.add(propertyData)];
            case 1:
                newPropertyRef = _a.sent();
                return [2 /*return*/, __assign({ id: newPropertyRef.id }, propertyData)];
        }
    });
}); };
// Update a property
export var updateProperty = function (id, updates) { return __awaiter(void 0, void 0, void 0, function () {
    var docRef;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                docRef = propertiesCollection.doc(id);
                return [4 /*yield*/, docRef.set(updates, { merge: true })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Delete a property
export var deleteProperty = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var docRef;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                docRef = propertiesCollection.doc(id);
                return [4 /*yield*/, docRef.delete()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Add an inquiry
export var createInquiry = function (inquiry) { return __awaiter(void 0, void 0, void 0, function () {
    var inquiryWithTimestamp, newInquiryRef;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                inquiryWithTimestamp = __assign(__assign({}, inquiry), { createdAt: Timestamp.now() });
                return [4 /*yield*/, inquiriesCollection.add(inquiryWithTimestamp)];
            case 1:
                newInquiryRef = _a.sent();
                return [2 /*return*/, __assign({ id: newInquiryRef.id }, inquiryWithTimestamp)];
        }
    });
}); };
// Fetch all inquiries
export var getAllInquiries = function () { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inquiriesCollection.get()];
            case 1:
                snapshot = _a.sent();
                return [2 /*return*/, snapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })];
        }
    });
}); };
// Get inquiries by user ID
export var getInquiriesByUser = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inquiriesCollection
                    .where("userId", "==", userId)
                    .get()];
            case 1:
                snapshot = _a.sent();
                return [2 /*return*/, snapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })];
        }
    });
}); };
// Get inquiries by property ID
export var getInquiriesByProperty = function (propertyId) { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, inquiriesCollection
                    .where("propertyId", "==", propertyId)
                    .get()];
            case 1:
                snapshot = _a.sent();
                return [2 /*return*/, snapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })];
        }
    });
}); };
export var deleteInquiry = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var docRef;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                docRef = inquiriesCollection.doc(id);
                return [4 /*yield*/, docRef.delete()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var storage = {
    getAllUsers: getAllUsers,
    getUserById: getUserById,
    addUser: addUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    getAllProperties: getAllProperties,
    getPropertyById: getPropertyById,
    getFeaturedProperties: getFeaturedProperties,
    addProperty: addProperty,
    updateProperty: updateProperty,
    deleteProperty: deleteProperty,
    createInquiry: createInquiry,
    getAllInquiries: getAllInquiries,
    getInquiriesByUser: getInquiriesByUser,
    getInquiriesByProperty: getInquiriesByProperty,
    deleteInquiry: deleteInquiry,
};
export default storage;
