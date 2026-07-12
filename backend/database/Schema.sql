--
-- PostgreSQL database dump
--

\restrict KdN6UWTQ7XpxkaSVc2X4nTK9VaITTbtpKOJTgV70ObqB8uOHlas2GtefhA6zaJM

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-07-12 12:09:32

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 221 (class 1259 OID 16431)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    phone character varying(20),
    profile_picture character varying(255),
    notification_preferences jsonb DEFAULT '{"sms": false, "push": true, "email": true, "whatsapp": false}'::jsonb,
    last_login timestamp without time zone,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    verification_token character varying(255),
    reset_password_token character varying(255),
    reset_password_expires timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['fleet_manager'::character varying, 'driver'::character varying, 'safety_officer'::character varying, 'financial_analyst'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16452)
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_number character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    model character varying(255) NOT NULL,
    make character varying(100) NOT NULL,
    year integer,
    type character varying(100) NOT NULL,
    category character varying(50) DEFAULT 'Commercial'::character varying,
    max_load_capacity numeric(10,2) NOT NULL,
    current_odometer numeric(10,2) DEFAULT 0,
    acquisition_cost numeric(10,2) NOT NULL,
    acquisition_date date,
    fuel_type character varying(50) DEFAULT 'Diesel'::character varying,
    status character varying(50) DEFAULT 'Available'::character varying,
    last_maintenance_date date,
    next_maintenance_due date,
    insurance_expiry date,
    registration_expiry date,
    location_lat numeric(10,8),
    location_lng numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicles_status_check CHECK (((status)::text = ANY ((ARRAY['Available'::character varying, 'On Trip'::character varying, 'In Shop'::character varying, 'Retired'::character varying])::text[])))
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- TOC entry 5055 (class 0 OID 16431)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, full_name, role, phone, profile_picture, notification_preferences, last_login, is_active, email_verified, verification_token, reset_password_token, reset_password_expires, created_at, updated_at) FROM stdin;
2d4c26d6-b5e4-461c-baf4-9c8332397def	admin@transitops.com	$2a$10$3HqSz9w7hC8sJ9K9x8F9fO9P9Q9R9S9T9U9V9W9X9Y9Z9A9B9C9D9E	System Admin	admin	\N	\N	{"sms": false, "push": true, "email": true, "whatsapp": false}	\N	t	t	\N	\N	\N	2026-07-12 11:58:17.066452	2026-07-12 11:58:17.066452
\.


--
-- TOC entry 5056 (class 0 OID 16452)
-- Dependencies: 222
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, registration_number, name, model, make, year, type, category, max_load_capacity, current_odometer, acquisition_cost, acquisition_date, fuel_type, status, last_maintenance_date, next_maintenance_due, insurance_expiry, registration_expiry, location_lat, location_lng, created_at, updated_at) FROM stdin;
286d4ee5-b166-4448-80e5-4a0e78e8a2fb	MH-01-AB-1234	TATA Ace	Ace HT	TATA	2023	Mini Truck	Commercial	500.00	0.00	800000.00	\N	Diesel	Available	\N	\N	\N	\N	\N	\N	2026-07-12 11:58:17.066452	2026-07-12 11:58:17.066452
\.


--
-- TOC entry 4894 (class 2606 OID 16451)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4896 (class 2606 OID 16449)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 16474)
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- TOC entry 4905 (class 2606 OID 16476)
-- Name: vehicles vehicles_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_registration_number_key UNIQUE (registration_number);


--
-- TOC entry 4890 (class 1259 OID 16650)
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_active ON public.users USING btree (is_active);


--
-- TOC entry 4891 (class 1259 OID 16648)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4892 (class 1259 OID 16649)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 4897 (class 1259 OID 16654)
-- Name: idx_vehicles_location_lat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_location_lat ON public.vehicles USING btree (location_lat);


--
-- TOC entry 4898 (class 1259 OID 16655)
-- Name: idx_vehicles_location_lng; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_location_lng ON public.vehicles USING btree (location_lng);


--
-- TOC entry 4899 (class 1259 OID 16652)
-- Name: idx_vehicles_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_registration ON public.vehicles USING btree (registration_number);


--
-- TOC entry 4900 (class 1259 OID 16651)
-- Name: idx_vehicles_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_status ON public.vehicles USING btree (status);


--
-- TOC entry 4901 (class 1259 OID 16653)
-- Name: idx_vehicles_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_type ON public.vehicles USING btree (type);


--
-- TOC entry 4906 (class 2620 OID 16637)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4907 (class 2620 OID 16638)
-- Name: vehicles update_vehicles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Completed on 2026-07-12 12:09:32

--
-- PostgreSQL database dump complete
--

\unrestrict KdN6UWTQ7XpxkaSVc2X4nTK9VaITTbtpKOJTgV70ObqB8uOHlas2GtefhA6zaJM

SET search_path = public;

-- ============================================
-- TABLES 3-7: Drivers, Trips, Maintenance, Fuel, Expenses
-- ALL FIXES APPLIED - READY TO RUN
-- ============================================

-- ============================================
-- TABLE 3: DRIVERS
-- ============================================

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(20),
    address TEXT,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_category VARCHAR(50) NOT NULL,
    license_expiry_date DATE NOT NULL,
    safety_score INTEGER DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
    total_trips_completed INTEGER DEFAULT 0,
    total_distance_driven DECIMAL(10,2) DEFAULT 0,
    harsh_braking_count INTEGER DEFAULT 0,
    harsh_acceleration_count INTEGER DEFAULT 0,
    speeding_events INTEGER DEFAULT 0,
    idling_time_minutes INTEGER DEFAULT 0,
    smooth_driving_score DECIMAL(5,2),
    fuel_efficiency_score DECIMAL(5,2),
    on_time_delivery_rate DECIMAL(5,2),
    last_performance_calculation DATE,
    status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended')),
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for drivers
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_license ON drivers(license_number);
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry_date);
CREATE INDEX idx_drivers_safety_score ON drivers(safety_score);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);

-- Trigger for drivers
CREATE TRIGGER update_drivers_updated_at 
    BEFORE UPDATE ON drivers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- TABLE 4: TRIPS
-- ============================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    source VARCHAR(255) NOT NULL,
    source_lat DECIMAL(10,8),
    source_lng DECIMAL(11,8),
    destination VARCHAR(255) NOT NULL,
    destination_lat DECIMAL(10,8),
    destination_lng DECIMAL(11,8),
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES drivers(id),
    cargo_description TEXT,
    cargo_weight DECIMAL(10,2) NOT NULL,
    cargo_value DECIMAL(10,2),
    planned_distance DECIMAL(10,2) NOT NULL,
    actual_distance DECIMAL(10,2),
    fuel_consumed DECIMAL(10,2),
    fuel_efficiency DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dispatched', 'In Progress', 'Completed', 'Cancelled', 'Delayed')),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    dispatched_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    delay_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for trips
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_created_at ON trips(created_at);
CREATE INDEX idx_trips_trip_number ON trips(trip_number);
CREATE INDEX idx_trips_priority ON trips(priority);
CREATE INDEX idx_trips_dates ON trips(dispatched_at, completed_at);

-- Triggers for trips
CREATE TRIGGER update_trips_updated_at 
    BEFORE UPDATE ON trips 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_trip_number_trigger 
    BEFORE INSERT ON trips 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_trip_number();

CREATE TRIGGER validate_trip_assignment_trigger
    BEFORE INSERT ON trips
    FOR EACH ROW
    EXECUTE FUNCTION validate_trip_assignment();

CREATE TRIGGER update_driver_stats_trigger 
    AFTER UPDATE ON trips 
    FOR EACH ROW 
    EXECUTE FUNCTION update_driver_stats();


-- ============================================
-- TABLE 5: MAINTENANCE LOGS
-- ============================================

CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT,
    cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    scheduled_date DATE NOT NULL,
    started_date DATE,
    completed_date DATE,
    performed_by VARCHAR(255),
    notes TEXT,
    parts_used JSONB,
    odometer_at_service DECIMAL(10,2),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for maintenance_logs
CREATE INDEX idx_maintenance_vehicle_id ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);
CREATE INDEX idx_maintenance_scheduled_date ON maintenance_logs(scheduled_date);

-- Triggers for maintenance_logs
CREATE TRIGGER update_maintenance_logs_updated_at 
    BEFORE UPDATE ON maintenance_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_maintenance_status_trigger
    AFTER INSERT OR UPDATE ON maintenance_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_maintenance_status();


-- ============================================
-- TABLE 6: FUEL LOGS
-- ============================================

CREATE TABLE fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    trip_id UUID REFERENCES trips(id),
    liters DECIMAL(10,2) NOT NULL,
    cost_per_liter DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    fuel_type VARCHAR(50) DEFAULT 'Diesel',
    odometer_reading DECIMAL(10,2) NOT NULL,
    station_name VARCHAR(255),
    station_location VARCHAR(255),
    date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fuel_logs
CREATE INDEX idx_fuel_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_trip_id ON fuel_logs(trip_id);
CREATE INDEX idx_fuel_date ON fuel_logs(date);
CREATE INDEX idx_fuel_odometer ON fuel_logs(odometer_reading);

-- Triggers for fuel_logs
CREATE TRIGGER calculate_fuel_total_cost_trigger
    BEFORE INSERT OR UPDATE ON fuel_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_fuel_total_cost();


-- ============================================
-- TABLE 7: EXPENSES
-- ============================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    trip_id UUID REFERENCES trips(id),
    expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('Toll', 'Parking', 'Repair', 'Insurance', 'Registration', 'Other')),
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    receipt_image VARCHAR(255),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for expenses
CREATE INDEX idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_type ON expenses(expense_type);

-- Triggers for expenses
CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- SAMPLE DATA (All Fixed)
-- ============================================

-- Insert a sample driver with FUTURE expiry date (FIXED)
INSERT INTO drivers (
    name,
    contact_number,
    license_number,
    license_category,
    license_expiry_date,
    status
) VALUES (
    'Rajesh Kumar',
    '9876543210',
    'DL-1234567890',
    'LMV',
    '2027-12-31',
    'Available'
);

-- Insert a sample trip
INSERT INTO trips (
    source,
    destination,
    vehicle_id,
    driver_id,
    cargo_weight,
    planned_distance,
    status,
    created_by
) VALUES (
    'Mumbai',
    'Pune',
    (SELECT id FROM vehicles WHERE registration_number = 'MH-01-AB-1234'),
    (SELECT id FROM drivers WHERE license_number = 'DL-1234567890'),
    250.00,
    150.00,
    'Draft',
    (SELECT id FROM users WHERE email = 'admin@transitops.com')
);

-- Insert a sample maintenance log
INSERT INTO maintenance_logs (
    vehicle_id,
    maintenance_type,
    description,
    cost,
    scheduled_date,
    status
) VALUES (
    (SELECT id FROM vehicles WHERE registration_number = 'MH-01-AB-1234'),
    'Oil Change',
    'Regular oil change and filter replacement',
    3500.00,
    CURRENT_DATE + INTERVAL '30 days',
    'Scheduled'
);

-- Insert a sample fuel log
INSERT INTO fuel_logs (
    vehicle_id,
    liters,
    cost_per_liter,
    total_cost,
    odometer_reading,
    date
) VALUES (
    (SELECT id FROM vehicles WHERE registration_number = 'MH-01-AB-1234'),
    50.00,
    95.00,
    4750.00,
    5000.00,
    CURRENT_DATE
);

-- Insert sample expenses
INSERT INTO expenses (
    vehicle_id,
    expense_type,
    description,
    amount,
    date
) VALUES (
    (SELECT id FROM vehicles WHERE registration_number = 'MH-01-AB-1234'),
    'Toll',
    'Mumbai-Pune toll plaza',
    250.00,
    CURRENT_DATE
);

INSERT INTO expenses (
    vehicle_id,
    expense_type,
    description,
    amount,
    date
) VALUES (
    (SELECT id FROM vehicles WHERE registration_number = 'MH-01-AB-1234'),
    'Parking',
    'Pune warehouse parking',
    100.00,
    CURRENT_DATE
);


-- ============================================
-- VERIFICATION QUERIES (FIXED - No Ambiguous Columns)
-- ============================================

-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check row counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'trips', COUNT(*) FROM trips
UNION ALL
SELECT 'maintenance_logs', COUNT(*) FROM maintenance_logs
UNION ALL
SELECT 'fuel_logs', COUNT(*) FROM fuel_logs
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses;

-- 3. Show all drivers
SELECT * FROM drivers;

-- 4. Show all trips
SELECT * FROM trips;

-- 5. Show all maintenance logs
SELECT * FROM maintenance_logs;

-- 6. Show all fuel logs
SELECT * FROM fuel_logs;

-- 7. Show all expenses
SELECT * FROM expenses;

-- 8. Verify driver license validity
SELECT 
    name, 
    license_number, 
    license_expiry_date,
    CASE 
        WHEN license_expiry_date > CURRENT_DATE THEN 'VALID ✅'
        ELSE 'EXPIRED ❌'
    END as license_status,
    status as driver_status
FROM drivers;

-- 9. Verify trips with vehicle and driver details (FIXED - No ambiguity)
SELECT 
    t.trip_number,
    t.source,
    t.destination,
    t.cargo_weight,
    t.planned_distance,
    t.status as trip_status,
    t.priority,
    v.registration_number,
    v.name as vehicle_name,
    v.status as vehicle_status,
    d.name as driver_name,
    d.license_number,
    d.license_expiry_date,
    d.status as driver_status
FROM trips t
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN drivers d ON t.driver_id = d.id
ORDER BY t.created_at DESC;

-- 10. Check for any data issues
SELECT 
    COUNT(*) as total_trips,
    COUNT(CASE WHEN t.vehicle_id IS NULL THEN 1 END) as trips_without_vehicle,
    COUNT(CASE WHEN t.driver_id IS NULL THEN 1 END) as trips_without_driver,
    COUNT(CASE WHEN t.status = 'Draft' THEN 1 END) as draft_trips,
    COUNT(CASE WHEN t.status = 'Completed' THEN 1 END) as completed_trips
FROM trips t;

-- 11. Show maintenance summary
SELECT 
    v.name as vehicle_name,
    COUNT(m.id) as maintenance_count,
    COALESCE(SUM(m.cost), 0) as total_maintenance_cost,
    m.status as maintenance_status
FROM maintenance_logs m
JOIN vehicles v ON m.vehicle_id = v.id
GROUP BY v.name, m.status
ORDER BY v.name;

-- 12. Show fuel summary
SELECT 
    v.name as vehicle_name,
    COUNT(f.id) as fuel_logs_count,
    COALESCE(SUM(f.liters), 0) as total_liters,
    COALESCE(SUM(f.total_cost), 0) as total_fuel_cost,
    ROUND(COALESCE(AVG(f.cost_per_liter), 0), 2) as avg_cost_per_liter
FROM fuel_logs f
JOIN vehicles v ON f.vehicle_id = v.id
GROUP BY v.name
ORDER BY v.name;

-- 13. Show expense summary by type
SELECT 
    expense_type,
    COUNT(*) as expense_count,
    COALESCE(SUM(amount), 0) as total_amount,
    ROUND(COALESCE(AVG(amount), 0), 2) as avg_amount
FROM expenses
GROUP BY expense_type
ORDER BY total_amount DESC;

-- 14. Complete fleet overview
SELECT 
    v.name as vehicle_name,
    v.registration_number,
    v.status as vehicle_status,
    COUNT(DISTINCT t.id) as total_trips,
    COALESCE(SUM(f.liters), 0) as total_fuel_used,
    COALESCE(SUM(f.total_cost), 0) as total_fuel_cost,
    COALESCE(SUM(e.amount), 0) as total_other_expenses,
    COALESCE(SUM(m.cost), 0) as total_maintenance_cost
FROM vehicles v
LEFT JOIN trips t ON v.id = t.vehicle_id
LEFT JOIN fuel_logs f ON v.id = f.vehicle_id
LEFT JOIN expenses e ON v.id = e.vehicle_id
LEFT JOIN maintenance_logs m ON v.id = m.vehicle_id
GROUP BY v.name, v.registration_number, v.status
ORDER BY v.name;

-- ============================================
-- END OF TABLES 3-7
-- ============================================

