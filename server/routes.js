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
import { createServer } from "http";
import { adminAuth, db } from "./firebase-admin"; // Import Firestore and Firebase Auth
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./uploadthing";
import nodemailer from "nodemailer";
export function registerRoutes(app) {
    return __awaiter(this, void 0, void 0, function () {
        var httpServer, requireAuth;
        var _this = this;
        return __generator(this, function (_a) {
            httpServer = createServer(app);
            requireAuth = function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var token, decodedToken, error_1;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split("Bearer ")[1];
                            if (!token)
                                throw new Error("No token provided");
                            return [4 /*yield*/, adminAuth.verifyIdToken(token)];
                        case 1:
                            decodedToken = _b.sent();
                            req.user = decodedToken; // Add the user property to the Request object
                            next();
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _b.sent();
                            res.status(401).json({ message: "Unauthorized" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); };
            app.use("/api/uploadthing", createRouteHandler({
                router: uploadRouter,
                config: {}, // Optional configuration
            }));
            console.log("✅ UploadThing API registered at /api/uploadthing");
            // Properties endpoints
            app.get("/api/properties", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var propertiesSnapshot, properties, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, db.collection("properties").get()];
                        case 1:
                            propertiesSnapshot = _a.sent();
                            properties = propertiesSnapshot.docs.map(function (doc) { return doc.data(); });
                            res.json(properties);
                            return [3 /*break*/, 3];
                        case 2:
                            error_2 = _a.sent();
                            console.error("❌ Error fetching properties:", error_2);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/properties/featured", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var featuredPropertiesSnapshot, featuredProperties, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, db
                                    .collection("properties")
                                    .where("featured", "==", true)
                                    .get()];
                        case 1:
                            featuredPropertiesSnapshot = _a.sent();
                            featuredProperties = featuredPropertiesSnapshot.docs.map(function (doc) {
                                return doc.data();
                            });
                            res.json(featuredProperties);
                            return [3 /*break*/, 3];
                        case 2:
                            error_3 = _a.sent();
                            console.error("❌ Error fetching featured properties:", error_3);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/properties/:id", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, propertyDoc, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            id = req.params.id;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, db.collection("properties").doc(id).get()];
                        case 2:
                            propertyDoc = _a.sent();
                            if (!propertyDoc.exists) {
                                return [2 /*return*/, res.status(404).json({ message: "Property not found" })];
                            }
                            res.json(propertyDoc.data());
                            return [3 /*break*/, 4];
                        case 3:
                            error_4 = _a.sent();
                            console.error("❌ Error fetching property:", error_4);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // Admin property management
            app.post("/api/properties", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var propertyData, propertyRef, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            propertyData = req.body;
                            return [4 /*yield*/, db.collection("properties").add(propertyData)];
                        case 1:
                            propertyRef = _a.sent();
                            res.status(201).json(__assign({ id: propertyRef.id }, propertyData));
                            return [3 /*break*/, 3];
                        case 2:
                            error_5 = _a.sent();
                            console.error("❌ Error adding property:", error_5);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.patch("/api/properties/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, updatedData, error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            id = req.params.id;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            updatedData = req.body;
                            return [4 /*yield*/, db.collection("properties").doc(id).update(updatedData)];
                        case 2:
                            _a.sent();
                            res.json(__assign({ id: id }, updatedData));
                            return [3 /*break*/, 4];
                        case 3:
                            error_6 = _a.sent();
                            console.error("❌ Error updating property:", error_6);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            app.delete("/api/properties/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            id = req.params.id;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, db.collection("properties").doc(id).delete()];
                        case 2:
                            _a.sent();
                            res.status(204).send();
                            return [3 /*break*/, 4];
                        case 3:
                            error_7 = _a.sent();
                            console.error("❌ Error deleting property:", error_7);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // Inquiries
            app.post("/api/inquiries", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var inquiryData, inquiryRef, error_8;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            inquiryData = __assign(__assign({}, req.body), { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid, createdAt: new Date().toISOString() });
                            return [4 /*yield*/, db.collection("inquiries").add(inquiryData)];
                        case 1:
                            inquiryRef = _b.sent();
                            res.status(201).json(__assign({ id: inquiryRef.id }, inquiryData));
                            return [3 /*break*/, 3];
                        case 2:
                            error_8 = _b.sent();
                            console.error("❌ Error creating inquiry:", error_8);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/inquiries", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var inquiriesSnapshot, inquiries, error_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, db.collection("inquiries").get()];
                        case 1:
                            inquiriesSnapshot = _a.sent();
                            inquiries = inquiriesSnapshot.docs.map(function (doc) { return doc.data(); });
                            res.json(inquiries);
                            return [3 /*break*/, 3];
                        case 2:
                            error_9 = _a.sent();
                            console.error("❌ Error fetching inquiries:", error_9);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/inquiries/property/:propertyId", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var propertyId, inquiriesSnapshot, inquiries, error_10;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            propertyId = req.params.propertyId;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, db
                                    .collection("inquiries")
                                    .where("propertyId", "==", propertyId)
                                    .get()];
                        case 2:
                            inquiriesSnapshot = _a.sent();
                            inquiries = inquiriesSnapshot.docs.map(function (doc) { return doc.data(); });
                            res.json(inquiries);
                            return [3 /*break*/, 4];
                        case 3:
                            error_10 = _a.sent();
                            console.error("❌ Error fetching inquiries by property:", error_10);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/inquiries/user/:userId", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var userId, inquiriesSnapshot, inquiries, error_11;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            userId = req.params.userId;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, db
                                    .collection("inquiries")
                                    .where("userId", "==", userId)
                                    .get()];
                        case 2:
                            inquiriesSnapshot = _a.sent();
                            inquiries = inquiriesSnapshot.docs.map(function (doc) { return doc.data(); });
                            res.json(inquiries);
                            return [3 /*break*/, 4];
                        case 3:
                            error_11 = _a.sent();
                            console.error("❌ Error fetching inquiries by user:", error_11);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            app.delete("/api/inquiries/:id", requireAuth, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var id, error_12;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            id = req.params.id;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, db.collection("inquiries").doc(id).delete()];
                        case 2:
                            _a.sent();
                            res.status(204).send();
                            return [3 /*break*/, 4];
                        case 3:
                            error_12 = _a.sent();
                            console.error("❌ Error deleting inquiry:", error_12);
                            res.status(500).json({ message: "Server error" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            // Contact form email sending
            app.post("/api/contact", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, name, email, message, transporter, error_13;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = req.body, name = _a.name, email = _a.email, message = _a.message;
                            if (!name || !email || !message) {
                                return [2 /*return*/, res.status(400).json({ error: "All fields are required" })];
                            }
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            transporter = nodemailer.createTransport({
                                host: process.env.SMTP_HOST,
                                port: Number(process.env.SMTP_PORT),
                                secure: true, // SSL
                                auth: {
                                    user: process.env.SMTP_USER,
                                    pass: process.env.SMTP_PASS,
                                },
                            });
                            return [4 /*yield*/, transporter.sendMail({
                                    from: "\"".concat(name, "\" <").concat(process.env.SMTP_USER, ">"),
                                    to: "info@giftandsonsinternational.com",
                                    subject: "New Inquiry Received",
                                    text: "Name: ".concat(name, "\nEmail: ").concat(email, "\n\nMessage:\n").concat(message),
                                })];
                        case 2:
                            _b.sent();
                            res.status(200).json({ message: "Email sent successfully" });
                            return [3 /*break*/, 4];
                        case 3:
                            error_13 = _b.sent();
                            console.error("Error sending email:", error_13);
                            res.status(500).json({ error: "Failed to send email" });
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/, httpServer];
        });
    });
}
