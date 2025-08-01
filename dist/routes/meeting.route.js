"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meeting_controller_1 = require("../controllers/meeting.controller");
const passport_config_1 = require("../config/passport.config");
const meetingRoutes = (0, express_1.Router)();
meetingRoutes.get("/user/all", passport_config_1.passportAuthenticateJwt, meeting_controller_1.getUserMeetingsController);
meetingRoutes.post("/public/create", meeting_controller_1.createMeetBookingForGuestController);
meetingRoutes.put("/cancel/:meetingId", passport_config_1.passportAuthenticateJwt, meeting_controller_1.cancelMeetingController);
exports.default = meetingRoutes;
