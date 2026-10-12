-- Mock baseline data. Run db/schema.sql on an empty database first.
BEGIN;

-- customers
INSERT INTO customers ("customer_id", "name", "email", "phone") VALUES (1, 'Mouhi', 'mouhi@example.com', '+358 40 000 0001');
INSERT INTO customers ("customer_id", "name", "email", "phone") VALUES (2, 'Unto', 'unto@example.com', '+358 40 000 0002');
INSERT INTO customers ("customer_id", "name", "email", "phone") VALUES (3, 'Waahto', 'waahto@example.com', '+358 40 000 0003');
INSERT INTO customers ("customer_id", "name", "email", "phone") VALUES (4, 'HoldingDong', 'holdingdong@example.com', '+358 40 000 0004');
INSERT INTO customers ("customer_id", "name", "email", "phone") VALUES (5, 'Grönroos & Grönroos', 'gronroos@example.com', '+358 40 000 0005');
SELECT setval(pg_get_serial_sequence('customers', 'customer_id'), (SELECT MAX(customer_id) FROM customers));

-- projects
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (2, 2, 'ongoing', '2026-07-01'::date, '2026-08-01'::date, NULL, 'https://example.com/onedrive/projects/project-2', NULL, NULL, NULL, NULL, NULL, '3472b6d9-153f-4218-a442-f273fbf78c79');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (3, 3, 'end', '2026-03-10'::date, '2026-04-01'::date, '2026-06-30'::date, 'https://example.com/onedrive/projects/project-3', NULL, NULL, NULL, NULL, NULL, 'b833a9a6-8698-447d-9ed4-a83b92e98d89');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (4, 1, 'start', '2026-08-20'::date, '2026-09-01'::date, NULL, 'https://example.com/onedrive/projects/project-4', NULL, NULL, NULL, NULL, NULL, 'aef75234-534d-4ebe-9470-8e04a12b9e3b');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (5, 1, 'ongoing', '2026-05-05'::date, '2026-06-01'::date, NULL, 'https://example.com/onedrive/projects/project-5', NULL, NULL, NULL, NULL, NULL, '9959171b-1922-4e82-8315-09a687d69214');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (6, 1, 'end', '2026-01-10'::date, '2026-02-01'::date, '2026-05-15'::date, 'https://example.com/onedrive/projects/project-6', NULL, NULL, NULL, NULL, NULL, '37891bd5-bf97-48b3-8270-9d1af514fc4e');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (7, 2, 'prospect', '2026-10-01'::date, NULL, NULL, 'https://example.com/onedrive/projects/project-7', NULL, NULL, NULL, NULL, NULL, 'cddeff75-6603-4604-b934-e08bad34983d');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (8, 2, 'start', '2026-08-20'::date, '2026-09-15'::date, NULL, 'https://example.com/onedrive/projects/project-8', NULL, NULL, NULL, NULL, NULL, '945a62fc-4dbe-4107-9f0a-3af8e3210243');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (9, 2, 'end', '2026-02-01'::date, '2026-03-01'::date, '2026-06-01'::date, 'https://example.com/onedrive/projects/project-9', NULL, NULL, NULL, NULL, NULL, 'ef6ec7c5-026e-459f-a6d5-534d7de48142');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (10, 3, 'prospect', '2026-10-05'::date, NULL, NULL, 'https://example.com/onedrive/projects/project-10', NULL, NULL, NULL, NULL, NULL, '78feb362-c49e-4de1-aa60-d2c612827c83');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (11, 3, 'start', '2026-09-01'::date, '2026-09-20'::date, NULL, 'https://example.com/onedrive/projects/project-11', NULL, NULL, NULL, NULL, NULL, '6a63f420-0f09-43df-8034-0c588bc985a9');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (12, 3, 'ongoing', '2026-06-15'::date, '2026-07-01'::date, NULL, 'https://example.com/onedrive/projects/project-12', NULL, NULL, NULL, NULL, NULL, '054a91a7-52cd-40bd-b01f-8a349c8ddf3b');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (1, 1, 'prospect', '2026-09-15'::date, '2026-10-13'::date, NULL, 'https://google.fi', '2026-10-11'::date, '2026-10-11'::date, NULL, NULL, NULL, '59a732e3-d6ef-4491-98b6-9c01a8312d7b');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (13, 4, 'prospect', '2026-09-20'::date, NULL, NULL, NULL, '2026-09-25'::date, NULL, NULL, NULL, NULL, '805a83ee-96e6-40c8-9e78-43e3118b50a5');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (14, 4, 'ongoing', '2026-07-25'::date, '2026-08-20'::date, NULL, NULL, '2026-08-01'::date, '2026-08-10'::date, '2026-09-01'::date, NULL, 'INV-2001', 'eb43fc7a-62ec-41c3-9547-e40e6be00061');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (15, 4, 'end', '2026-03-01'::date, '2026-03-20'::date, '2026-06-01'::date, NULL, '2026-03-05'::date, '2026-03-10'::date, '2026-06-02'::date, '2026-07-01'::date, 'INV-1003', '6b9cff7e-2cf9-4737-8a67-92acb8c7c174');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (17, 5, 'prospect', '2026-08-25'::date, NULL, NULL, NULL, '2026-09-01'::date, '2026-09-05'::date, NULL, NULL, NULL, 'e60023ba-21a7-48c0-9895-062f8603f8c2');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (18, 5, 'ongoing', '2026-07-01'::date, '2026-07-15'::date, NULL, NULL, '2026-07-05'::date, '2026-07-10'::date, '2026-08-15'::date, '2026-09-15'::date, 'INV-1004', '323bd31f-2681-4912-af33-48c2a15254bb');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (19, 2, 'ongoing', '2026-05-20'::date, '2026-06-01'::date, NULL, NULL, '2026-05-25'::date, '2026-05-30'::date, '2026-09-30'::date, NULL, 'INV-2002', '25d636d1-f570-42e5-828a-3056121ee187');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (20, 2, 'end', '2026-01-05'::date, '2026-01-20'::date, '2026-02-28'::date, NULL, '2026-01-08'::date, '2026-01-12'::date, '2026-02-28'::date, '2026-03-20'::date, 'INV-1001', '3bcd7b0c-c714-469c-b364-81deb27aa6b4');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (21, 2, 'prospect', '2026-10-06'::date, NULL, NULL, NULL, '2026-10-06'::date, NULL, NULL, NULL, NULL, 'fb37747d-02e6-4d58-9fe4-b65145b672ac');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (16, 5, 'start', '2026-10-02'::date, '2026-10-13'::date, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1e1c678b-a46a-432a-b3ac-5492b3b7da24');
INSERT INTO projects ("project_id", "customer_id", "status", "prospect_date", "start_date", "end_date", "folder_url", "quote_sent_date", "quote_accepted_date", "invoice_sent_date", "invoice_paid_date", "invoice_number", "qr_token") VALUES (22, 2, 'ongoing', '2026-10-01'::date, '2026-10-05'::date, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '6336a90a-c0ac-432b-a7db-bca3c1dcfbaf');
SELECT setval(pg_get_serial_sequence('projects', 'project_id'), (SELECT MAX(project_id) FROM projects));

-- files
INSERT INTO files ("file_id", "project_id", "description", "created_at") VALUES ('P0013-01', 22, 'Mock-kyltti: aulan opaste', '2026-10-12 11:09:14.224790+00:00'::timestamptz);

-- machines
INSERT INTO machines ("machine_id", "name", "type", "qr_token") VALUES (1, 'UV-tulostin', 'uvPrint', 'd50766da-2268-478e-9c57-8fdd040c1568');
INSERT INTO machines ("machine_id", "name", "type", "qr_token") VALUES (2, 'Digitaalileikkuri', 'cut', '9662ddf5-b1f9-4e82-8264-b5702a6f26ce');
INSERT INTO machines ("machine_id", "name", "type", "qr_token") VALUES (3, 'CNC-jyrsin', 'route', '63722323-4627-403c-b0af-23a3c9a7da2c');
SELECT setval(pg_get_serial_sequence('machines', 'machine_id'), (SELECT MAX(machine_id) FROM machines));

-- materials
INSERT INTO materials ("material_id", "name", "qr_token") VALUES (1, 'Alumiinikomposiittilevy 3 mm', '26c9e2b789ec30b4ec052f5fe74360fb');
INSERT INTO materials ("material_id", "name", "qr_token") VALUES (2, 'Vaahtomuovilevy PVC 5 mm', '960f1fe1d679050c4647a4a296aa4fd2');
INSERT INTO materials ("material_id", "name", "qr_token") VALUES (3, 'Akryylilevy 3 mm', '9534876f193b7329470a00deb0a6ee24');
INSERT INTO materials ("material_id", "name", "qr_token") VALUES (4, 'Polykarbonaattilevy 2 mm', 'b0fe0127bcf7759dd8e498d44aea7092');
INSERT INTO materials ("material_id", "name", "qr_token") VALUES (5, 'Kiiltävä vinyylitarra', 'cb4f990e56c84c7ece30dbc840e2dffd');
SELECT setval(pg_get_serial_sequence('materials', 'material_id'), (SELECT MAX(material_id) FROM materials));

-- operations
INSERT INTO operations ("operation_id", "file_id", "material_id", "machine_id", "method", "started_at", "ended_at") VALUES (1, 'P0013-01', 1, 1, 'uvPrint', '2026-10-06 06:00:00+00:00'::timestamptz, '2026-10-06 06:40:00+00:00'::timestamptz);
INSERT INTO operations ("operation_id", "file_id", "material_id", "machine_id", "method", "started_at", "ended_at") VALUES (2, 'P0013-01', 1, 2, 'cut', '2026-10-06 07:00:00+00:00'::timestamptz, '2026-10-06 07:25:00+00:00'::timestamptz);
INSERT INTO operations ("operation_id", "file_id", "material_id", "machine_id", "method", "started_at", "ended_at") VALUES (3, 'P0013-01', 2, 3, 'route', '2026-10-07 05:00:00+00:00'::timestamptz, '2026-10-07 05:50:00+00:00'::timestamptz);
INSERT INTO operations ("operation_id", "file_id", "material_id", "machine_id", "method", "started_at", "ended_at") VALUES (4, 'P0013-01', 5, 1, 'uvPrint', '2026-10-08 06:00:00+00:00'::timestamptz, '2026-10-08 06:30:00+00:00'::timestamptz);
INSERT INTO operations ("operation_id", "file_id", "material_id", "machine_id", "method", "started_at", "ended_at") VALUES (5, 'P0013-01', 3, 3, 'route', '2026-10-10 08:00:00+00:00'::timestamptz, NULL);
SELECT setval(pg_get_serial_sequence('operations', 'operation_id'), (SELECT MAX(operation_id) FROM operations));

-- selections
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (17, 'machine', 1, '2026-10-12 14:00:02.028701+00:00'::timestamptz, 1);
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (17, 'material', 4, '2026-10-12 14:00:07.125855+00:00'::timestamptz, 2);
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (22, 'machine', 1, '2026-10-12 14:04:11.188960+00:00'::timestamptz, 3);
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (22, 'machine', 2, '2026-10-12 14:04:11.417181+00:00'::timestamptz, 4);
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (22, 'material', 3, '2026-10-12 14:04:11.641039+00:00'::timestamptz, 5);
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (22, 'material', 3, '2026-10-12 14:04:11.871133+00:00'::timestamptz, 6);
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (17, 'machine', 2, '2026-10-12 14:05:19.107158+00:00'::timestamptz, 7);
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (17, 'machine', 2, '2026-10-12 14:05:22.456632+00:00'::timestamptz, 8);
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (17, 'machine', 3, '2026-10-12 14:05:48.022606+00:00'::timestamptz, 9);
INSERT INTO selections ("project_id", "item_kind", "item_id", "selected_at", "selection_id") VALUES (22, 'machine', 1, '2026-10-12 14:06:43.774726+00:00'::timestamptz, 10);
SELECT setval(pg_get_serial_sequence('selections', 'selection_id'), (SELECT MAX(selection_id) FROM selections));

COMMIT;
