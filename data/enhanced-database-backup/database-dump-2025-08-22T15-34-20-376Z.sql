-- Enhanced Database Backup - 2025-08-22T15-34-20-376Z
-- Smart Printing Solutions - Complete Database Restoration

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "password" TEXT,
    "profilePicture" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientType" TEXT NOT NULL,
    "companyName" TEXT,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "product" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sides" TEXT NOT NULL,
    "printing" TEXT NOT NULL,
    "colors" TEXT, productName TEXT, printingSelection TEXT, flatSizeHeight REAL, closeSizeSpine REAL, useSameAsFlat BOOLEAN DEFAULT 0, flatSizeWidth REAL, flatSizeSpine REAL, closeSizeHeight REAL, closeSizeWidth REAL,
    CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Paper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gsm" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "inputWidth" REAL,
    "inputHeight" REAL,
    "pricePerPacket" REAL,
    "pricePerSheet" REAL,
    "sheetsPerPacket" INTEGER,
    "recommendedSheets" INTEGER,
    "enteredSheets" INTEGER,
    "outputWidth" REAL,
    "outputHeight" REAL,
    "selectedColors" TEXT,
    CONSTRAINT "Paper_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Finishing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "cost" REAL,
    CONSTRAINT "Finishing_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "QuoteAmount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "base" REAL NOT NULL,
    "vat" REAL NOT NULL,
    "total" REAL NOT NULL,
    "quoteId" TEXT NOT NULL,
    CONSTRAINT "QuoteAmount_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "QuoteOperational" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "plates" INTEGER,
    "units" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuoteOperational_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SearchAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "SearchAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "countryCode" TEXT DEFAULT '+971',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'UAE',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gsm" TEXT,
    "supplierId" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Data for table: User
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmekilpoq0000xffloxu9xcse', 'Zee@example.com', 'Zee', 'admin', 'admin123', NULL, 'Active', '2025-08-20T21:58:52.490Z', '2025-08-20T22:08:20.623Z');
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmekj0vxf0006xffl2xdoub1x', 'admin@example.com', 'John Wick', 'admin', 'admin123', NULL, 'Active', '2025-08-20T22:10:40.342Z', '2025-08-20T22:10:40.342Z');
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmek2grmu0000x507s347xk7j', 'admin@smartprint.com', 'Admin', 'admin', 'admin123', NULL, 'Active', '2025-08-20T14:27:07.876Z', '2025-08-20T15:39:57.636Z');
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmek2grnf0001x50772sxw531', 'estimator@smartprint.com', 'Estimator', 'user', 'password123', NULL, 'Active', '2025-08-20T14:27:07.900Z', '2025-08-20T15:39:57.639Z');
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmek2grnj0002x507ds08w13l', 'manager@smartprint.com', 'Manager', 'manager', 'manager123', NULL, 'Active', '2025-08-20T14:27:07.903Z', '2025-08-20T15:39:57.643Z');
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmek2grnl0003x507445785fy', 'user@smartprint.com', 'User', 'user', 'password123', NULL, 'Active', '2025-08-20T14:27:07.905Z', '2025-08-20T15:39:57.647Z');
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmek2grnn0004x5076wolf668', 'zee@smartprint.com', 'Zee', 'user', 'admin123', NULL, 'Active', '2025-08-20T14:27:07.908Z', '2025-08-20T19:10:39.843Z');
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmek2oic80002x5xjcvofcdxt', 'alifka@gmail.com', 'Alifka', 'admin', 'admin123', NULL, 'Active', '2025-08-20T14:33:09.080Z', '2025-08-20T14:33:09.080Z');
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmek5124f0001x5l8vyinw9i6', 'estimator@example.com', 'Jane Estimator', 'estimator', 'estimator123', NULL, 'Active', '2025-08-20T15:38:53.824Z', '2025-08-20T15:39:57.628Z');
INSERT INTO "User" ("id", "email", "name", "role", "password", "profilePicture", "status", "createdAt", "updatedAt") VALUES ('cmek5124s0002x5l8j8iyshyx', 'user@example.com', 'Bob User', 'user', 'admin123', NULL, 'Active', '2025-08-20T15:38:53.836Z', '2025-08-20T22:18:16.661Z');

-- Data for table: Finishing
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380727_0wqrs0arc', 'UV Spot', 'cmek2epwd001wx5j7q9qx49a5', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380775_ql77qf1kt', 'Lamination', 'cmek2epyp002lx5j782u8z8rf', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380776_19ch1zqm2', 'UV Spot', 'cmek2eq0c0030x5j7nh64b7la', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380778_zsidiehbb', 'UV Spot', 'cmek2eq0z0035x5j78d2bh52a', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380778_mlcs66zch', 'UV Spot', 'cmekj5xca0013xfflnbl5ohpr', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380778_jd8rjrj4f', 'UV Spot', 'cmekilram0003xfflus48jf6p', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380780_xvjg08pe2', 'UV Spot', 'cmek39ntx000jx5xjpk1lqq87', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380781_uoahi253k', 'UV Spot', 'cmek38mmv000dx5xj81sjd9pk', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380781_7vda14cuw', 'UV Spot', 'cmek2epz5002qx5j701d8lfv6', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380781_b6fzla1gs', 'Lamination', 'cmek2epxt002bx5j7f82jxumw', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380774_flgjci5mq', 'Lamination', 'cmek2epyd002gx5j736tpmlo3', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380782_qnhdnnlt4', 'Embossing', 'cmek2epww0021x5j703n82450', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875380785_w7a0keyh8', 'Lamination', 'cmek2epxd0026x5j71rlvx9tw', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987050_tiwwgzd1t', 'UV Spot', 'cmek2epwd001wx5j7q9qx49a5', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987078_lgfeytmg2', 'Lamination', 'cmek2epyd002gx5j736tpmlo3', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987079_oa2stwj8t', 'UV Spot', 'cmekj5xca0013xfflnbl5ohpr', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987079_gkmyqd35i', 'UV Spot', 'cmekilram0003xfflus48jf6p', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987079_76s693x00', 'UV Spot', 'cmek39ntx000jx5xjpk1lqq87', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987079_oit5t63ag', 'UV Spot', 'cmek38mmv000dx5xj81sjd9pk', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987079_nr1f9zmiq', 'UV Spot', 'cmek2epz5002qx5j701d8lfv6', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987078_od3twstos', 'UV Spot', 'cmek2eq0c0030x5j7nh64b7la', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987078_tyjs0g8fj', 'UV Spot', 'cmek2eq0z0035x5j78d2bh52a', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987082_sav33if3u', 'Lamination', 'cmek2epxd0026x5j71rlvx9tw', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987080_014yguwbw', 'Lamination', 'cmek2epxt002bx5j7f82jxumw', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987082_7ad3tqoh9', 'Embossing', 'cmek2epww0021x5j703n82450', NULL);
INSERT INTO "Finishing" ("id", "name", "quoteId", "cost") VALUES ('finish_1755875987078_69dnq14we', 'Lamination', 'cmek2epyp002lx5j782u8z8rf', NULL);

-- Data for table: QuoteAmount
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987003_e739an1rs', 120, 7.8, 163.8, 'cmek2epwd001wx5j7q9qx49a5');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987009_hflexv7of', 1440, 93.6, 1965.6, 'cmek2epyd002gx5j736tpmlo3');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987012_hq87tw9gq', 120, 7.8, 163.8, 'cmekj5xca0013xfflnbl5ohpr');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987012_0a20rlc45', 120, 7.8, 163.8, 'cmekilram0003xfflus48jf6p');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987013_9o17z6qul', 120, 7.8, 163.8, 'cmek39ntx000jx5xjpk1lqq87');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987013_x4ucqz5dt', 120, 7.8, 163.8, 'cmek38mmv000dx5xj81sjd9pk');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987014_g7ryp13zx', 7.5, 0.49, 10.24, 'cmek2epz5002qx5j701d8lfv6');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987011_ruwh7ijjx', 94.5, 6.14, 128.99, 'cmek2eq0c0030x5j7nh64b7la');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987016_me2w3t3e6', 625, 39.06, 820.31, 'cmek2epww0021x5j703n82450');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987017_k1qojwdpr', 540, 32.4, 680.4, 'cmek2epxd0026x5j71rlvx9tw');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987014_r6lsbp3ep', 192, 12, 252, 'cmek2epxt002bx5j7f82jxumw');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987011_5wsliuh3o', 22.5, 1.46, 30.71, 'cmek2eq0z0035x5j78d2bh52a');
INSERT INTO "QuoteAmount" ("id", "base", "vat", "total", "quoteId") VALUES ('amount_1755875987010_jv27xuhau', 36, 2.43, 51.03, 'cmek2epyp002lx5j782u8z8rf');

-- Data for table: SearchHistory
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3rfg0007xffl3d1l6pdj', 'j', '2025-08-20T22:12:54.557Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3rje0008xfflxhdgu0z2', 'jo', '2025-08-20T22:12:54.699Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3rmg0009xfflk6wy8y3p', 'joh', '2025-08-20T22:12:54.809Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3rpb000axffljb4aor6b', 'john', '2025-08-20T22:12:54.912Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3rw3000bxfflesq8frrn', 'john', '2025-08-20T22:12:55.155Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3ryb000cxffluwk4dd7g', 'john w', '2025-08-20T22:12:55.235Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3s5l000dxfflkqqr1d7p', 'john wi', '2025-08-20T22:12:55.498Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3s6b000exfflaa078l9n', 'john wic', '2025-08-20T22:12:55.523Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3s6k000fxfflq6dvj0tr', 'john wick', '2025-08-20T22:12:55.532Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3t68000gxfflfbx9fog9', 'john wic', '2025-08-20T22:12:56.816Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3tb2000hxffldbc15mqm', 'john wi', '2025-08-20T22:12:56.990Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3tqx000ixfflnc7xzxke', 'john w', '2025-08-20T22:12:57.562Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3tyh000jxffl7l1wid6r', 'john', '2025-08-20T22:12:57.833Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3uk6000kxfflw0l1pcpb', 'john', '2025-08-20T22:12:58.615Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3xpd000lxffluzc4vwq7', 'joh', '2025-08-20T22:13:02.690Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3xu6000mxfflg0b3rtfc', 'jo', '2025-08-20T22:13:02.863Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3xyw000nxffl236yoxz2', 'j', '2025-08-20T22:13:03.033Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3ybe000oxffloeeobqvc', 'a', '2025-08-20T22:13:03.482Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3yhx000pxfflmzd542w0', 'al', '2025-08-20T22:13:03.717Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3ynn000qxffl81l4aa7e', 'ali', '2025-08-20T22:13:03.924Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3ytr000rxfflh7m9jmu9', 'alif', '2025-08-20T22:13:04.144Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3yv5000sxffli48b9n2h', 'alifk', '2025-08-20T22:13:04.193Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj3yz9000txffl7zefdjq1', 'alifka', '2025-08-20T22:13:04.342Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj44x6000uxffl477tv8n2', 'a', '2025-08-20T22:13:12.042Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj458n000vxfflk9szs5nq', 'al', '2025-08-20T22:13:12.455Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj45da000wxfflhruro2i6', 'ali', '2025-08-20T22:13:12.622Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj45dx000xxfflxllejkj6', 'alif', '2025-08-20T22:13:12.646Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj45if000yxfflnnu9zif9', 'alifk', '2025-08-20T22:13:12.808Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj45lt000zxfflsjnbujag', 'alifka', '2025-08-20T22:13:12.930Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekj49el0010xfflkn6k71kn', 'alifka', '2025-08-20T22:13:17.853Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6lrg001oxffl5s91caz7', 's', '2025-08-20T23:11:06.412Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6lw1001pxfflpkupmzxy', 'su', '2025-08-20T23:11:06.568Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6m5p001qxfflb3fa6lzm', 'supp', '2025-08-20T23:11:06.926Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6m6x001rxffl65pchsx3', 'sup', '2025-08-20T23:11:06.969Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6myk001sxffl6asfhspi', 'suppl', '2025-08-20T23:11:07.965Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6n45001txfflqptj5dr3', 'suppli', '2025-08-20T23:11:08.165Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6nb5001uxffl7xq1hkax', 'supplie', '2025-08-20T23:11:08.418Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6ngy001vxffl0col6ee0', 'supplier', '2025-08-20T23:11:08.626Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6s72001wxfflvz243n5x', 'a', '2025-08-20T23:11:14.751Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6sdm001xxffl2wp23ee0', 'al', '2025-08-20T23:11:14.986Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6skw001yxfflyqgsrk83', 'ali', '2025-08-20T23:11:15.249Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmekl6sqn001zxfflgkcdichi', 'alif', '2025-08-20T23:11:15.455Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmel44cto0000ykcza96c074r', 's', '2025-08-21T08:01:14.220Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmel44d0o0001ykczqww3399y', 'sup', '2025-08-21T08:01:14.397Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmel44ddl0002ykczxsvhxr7w', 'su', '2025-08-21T08:01:14.937Z', NULL);
INSERT INTO "SearchHistory" ("id", "query", "timestamp", "userId") VALUES ('cmel44e8l0003ykczqxvwy5hg', 'supp', '2025-08-21T08:01:16.054Z', NULL);

-- Data for table: Material
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmekl628w001fxfflpfh6gjxc', 'M-001', 'Art Paper 300gsm', '300', 'cmekl6224001cxfflcsag532o', 0.5, 'per_sheet', 'Active', '2025-08-20T23:10:41.120Z', '2025-08-20T23:10:41.120Z', 1755873085506);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmekl62ci001hxfflct9y3u00', 'M-002', 'Art Paper 150gsm', '150', 'cmekl6224001cxfflcsag532o', 0.18, 'per_sheet', 'Active', '2025-08-20T23:10:41.250Z', '2025-08-20T23:10:41.250Z', 1755873085509);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmekl62fu001jxfflhyanswgp', 'M-003', 'Glossy Paper 200gsm', '200', 'cmekl61yw001bxffldvavdcde', 0.35, 'per_sheet', 'Active', '2025-08-20T23:10:41.370Z', '2025-08-20T23:10:41.370Z', 1755873085512);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmekl62is001lxfflwqs48kuq', 'M-004', 'Matte Paper 250gsm', '250', 'cmekl61yw001bxffldvavdcde', 0.42, 'per_sheet', 'Active', '2025-08-20T23:10:41.476Z', '2025-08-20T23:10:41.476Z', 1755873085514);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmekl62lv001nxfflt337t32y', 'M-005', 'Cardboard 400gsm', '400', 'cmekl624p001dxffl3h7p12fb', 0.85, 'per_sheet', 'Active', '2025-08-20T23:10:41.588Z', '2025-08-20T23:10:41.588Z', 1755873085517);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzrk0005x5rcb3vmn7dg', 'M-007', 'Coated Paper 120gsm', '120', 'cmekl61yw001bxffldvavdcde', 0.28, 'per_sheet', 'Active', 1755873085521, 1755873085521, 1755873085521);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzrq0007x5rckyi4x178', 'M-008', 'Coated Paper 135gsm', '135', 'cmekl61yw001bxffldvavdcde', 0.32, 'per_sheet', 'Active', 1755873085527, 1755873085527, 1755873085527);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzru0009x5rc5ob5lmlp', 'M-609', 'Coated Paper 170gsm', '170', 'cmekl61yw001bxffldvavdcde', 0.38, 'per_sheet', 'Active', 1755873085531, 1755873085531, 1755873085531);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzrx000bx5rcfswuv9wz', 'M-263', 'Coated Paper 300gsm', '300', 'cmekl61yw001bxffldvavdcde', 0.65, 'per_sheet', 'Active', 1755873085534, 1755873085534, 1755873085534);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzs4000dx5rc7usfct5c', 'M-078', 'Uncoated Paper 80gsm', '80', 'cmekl6224001cxfflcsag532o', 0.12, 'per_sheet', 'Active', 1755873085541, 1755873085541, 1755873085541);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzse000fx5rcbnk8mhpv', 'M-478', 'Uncoated Paper 100gsm', '100', 'cmekl6224001cxfflcsag532o', 0.15, 'per_sheet', 'Active', 1755873085550, 1755873085550, 1755873085550);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzsh000hx5rc24cdx89h', 'M-831', 'Uncoated Paper 120gsm', '120', 'cmekl6224001cxfflcsag532o', 0.18, 'per_sheet', 'Active', 1755873085553, 1755873085553, 1755873085553);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzsu000jx5rcnm2vdqay', 'M-716', 'Uncoated Paper 160gsm', '160', 'cmekl6224001cxfflcsag532o', 0.22, 'per_sheet', 'Active', 1755873085566, 1755873085566, 1755873085566);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzt1000lx5rcs1np90v4', 'M-885', 'Cardboard 250gsm', '250', 'cmekl624p001dxffl3h7p12fb', 0.55, 'per_sheet', 'Active', 1755873085574, 1755873085574, 1755873085574);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhztl000nx5rcgbh9bfl5', 'M-537', 'Cardboard 300gsm', '300', 'cmekl624p001dxffl3h7p12fb', 0.65, 'per_sheet', 'Active', 1755873085593, 1755873085593, 1755873085593);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhztr000px5rchb5x33kl', 'M-103', 'Cardboard 500gsm', '500', 'cmekl624p001dxffl3h7p12fb', 1.05, 'per_sheet', 'Active', 1755873085599, 1755873085599, 1755873085599);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhztw000rx5rcxaeh6mef', 'M-535', 'Recycled Paper 100gsm', '100', 'cmemxhzqp0000x5rctz7cm8xl', 0.18, 'per_sheet', 'Active', 1755873085604, 1755873085604, 1755873085604);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzu0000tx5rcsegyw1ng', 'M-913', 'Recycled Paper 120gsm', '120', 'cmemxhzqp0000x5rctz7cm8xl', 0.22, 'per_sheet', 'Active', 1755873085608, 1755873085608, 1755873085608);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzu7000vx5rcc22nwimj', 'M-228', 'Recycled Paper 150gsm', '150', 'cmemxhzqp0000x5rctz7cm8xl', 0.28, 'per_sheet', 'Active', 1755873085616, 1755873085616, 1755873085616);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzue000xx5rckjri7il6', 'M-596', 'Specialty Paper 200gsm', '200', 'cmemxhzqv0001x5rcg3qxtef6', 0.45, 'per_sheet', 'Active', 1755873085623, 1755873085623, 1755873085623);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzul000zx5rcxzglzjo1', 'M-542', 'Specialty Paper 250gsm', '250', 'cmemxhzqv0001x5rcg3qxtef6', 0.55, 'per_sheet', 'Active', 1755873085629, 1755873085629, 1755873085629);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzuq0011x5rcx6l1dc78', 'M-105', 'Specialty Paper 300gsm', '300', 'cmemxhzqv0001x5rcg3qxtef6', 0.68, 'per_sheet', 'Active', 1755873085635, 1755873085635, 1755873085635);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzuv0013x5rc38xy4fo9', 'M-262', 'Textured Paper 150gsm', '150', 'cmemxhzqy0002x5rctv3hkxc6', 0.35, 'per_sheet', 'Active', 1755873085640, 1755873085640, 1755873085640);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzv00015x5rc40gmypfl', 'M-986', 'Textured Paper 200gsm', '200', 'cmemxhzqy0002x5rctv3hkxc6', 0.42, 'per_sheet', 'Active', 1755873085645, 1755873085645, 1755873085645);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzv50017x5rckfrue79v', 'M-644', 'Textured Paper 250gsm', '250', 'cmemxhzqy0002x5rctv3hkxc6', 0.52, 'per_sheet', 'Active', 1755873085649, 1755873085649, 1755873085649);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzv80019x5rcn3esdmsl', 'M-879', 'Bond Paper 90gsm', '90', 'cmemxhzr10003x5rcu6yi5f7v', 0.16, 'per_sheet', 'Active', 1755873085652, 1755873085652, 1755873085652);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzvc001bx5rc5143pb6y', 'M-632', 'Bond Paper 100gsm', '100', 'cmemxhzr10003x5rcu6yi5f7v', 0.18, 'per_sheet', 'Active', 1755873085656, 1755873085656, 1755873085656);
INSERT INTO "Material" ("id", "materialId", "name", "gsm", "supplierId", "cost", "unit", "status", "lastUpdated", "createdAt", "updatedAt") VALUES ('cmemxhzvh001dx5rc6g2tmdhz', 'M-356', 'Bond Paper 120gsm', '120', 'cmemxhzr10003x5rcu6yi5f7v', 0.22, 'per_sheet', 'Active', 1755873085662, 1755873085662, 1755873085662);

-- Data for table: Supplier
INSERT INTO "Supplier" ("id", "name", "contact", "email", "phone", "countryCode", "address", "city", "state", "postalCode", "country", "status", "createdAt", "updatedAt") VALUES ('cmekl61yw001bxffldvavdcde', 'Paper Source LLC', 'Ahmed Al Mansouri', 'ahmed@papersourcellc.ae', '0501234567', '+971', 'Sheikh Zayed Road, Business Bay', 'Dubai', 'Dubai', '12345', 'UAE', 'Active', '2025-08-20T23:10:40.761Z', 1755873085479);
INSERT INTO "Supplier" ("id", "name", "contact", "email", "phone", "countryCode", "address", "city", "state", "postalCode", "country", "status", "createdAt", "updatedAt") VALUES ('cmekl6224001cxfflcsag532o', 'Apex Papers', 'Sarah Johnson', 'sarah@apexpapers.ae', '0509876543', '+971', 'Al Wasl Road, Jumeirah', 'Dubai', 'Dubai', '54321', 'UAE', 'Active', '2025-08-20T23:10:40.876Z', 1755873085481);
INSERT INTO "Supplier" ("id", "name", "contact", "email", "phone", "countryCode", "address", "city", "state", "postalCode", "country", "status", "createdAt", "updatedAt") VALUES ('cmekl624p001dxffl3h7p12fb', 'Premium Print Supplies', 'Mohammed Al Rashid', 'mohammed@premiumprint.ae', '0505555555', '+971', 'Jumeirah Road, Umm Suqeim', 'Dubai', 'Dubai', '67890', 'UAE', 'Active', '2025-08-20T23:10:40.969Z', 1755873085485);
INSERT INTO "Supplier" ("id", "name", "contact", "email", "phone", "countryCode", "address", "city", "state", "postalCode", "country", "status", "createdAt", "updatedAt") VALUES ('cmemxhzqp0000x5rctz7cm8xl', 'Global Paper Solutions', 'Fatima Al Zahra', 'fatima@globalpapersolutions.ae', '0501111111', '+971', 'Al Maktoum Street, Deira', 'Dubai', 'Dubai', '11111', 'UAE', 'Active', 1755873085489, 1755873085489);
INSERT INTO "Supplier" ("id", "name", "contact", "email", "phone", "countryCode", "address", "city", "state", "postalCode", "country", "status", "createdAt", "updatedAt") VALUES ('cmemxhzqv0001x5rcg3qxtef6', 'Elite Print Materials', 'Omar Al Hashimi', 'omar@eliteprintmaterials.ae', '0502222222', '+971', 'Al Khaleej Street, Bur Dubai', 'Dubai', 'Dubai', '22222', 'UAE', 'Active', 1755873085495, 1755873085495);
INSERT INTO "Supplier" ("id", "name", "contact", "email", "phone", "countryCode", "address", "city", "state", "postalCode", "country", "status", "createdAt", "updatedAt") VALUES ('cmemxhzqy0002x5rctv3hkxc6', 'Quality Paper Co.', 'Aisha Al Falasi', 'aisha@qualitypaperco.ae', '0503333333', '+971', 'Al Rigga Street, Deira', 'Dubai', 'Dubai', '33333', 'UAE', 'Active', 1755873085498, 1755873085498);
INSERT INTO "Supplier" ("id", "name", "contact", "email", "phone", "countryCode", "address", "city", "state", "postalCode", "country", "status", "createdAt", "updatedAt") VALUES ('cmemxhzr10003x5rcu6yi5f7v', 'Professional Print Supplies', 'Khalid Al Mansouri', 'khalid@professionalprintsupplies.ae', '0504444444', '+971', 'Al Muraqqabat Street, Deira', 'Dubai', 'Dubai', '44444', 'UAE', 'Active', 1755873085502, 1755873085502);

-- Data for table: Client
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmekilqus0001xfflrr98j2ym', 'Company', 'Sample Company', 'John Doe', 'client@example.com', '+1234567890', 'US', 'Manager', '2025-08-20T21:58:54.005Z', '2025-08-20T21:58:54.005Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epop0004x5j7m81cyrgz', 'Company', 'Eagan Inc.', 'John Eagan', 'john.e@eagan.com', '50 123 4567', '+971', 'CEO', '2025-08-20T14:25:32.042Z', '2025-08-20T14:25:32.042Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epp30005x5j7x2kutb10', 'Company', 'Maxtion Dev', 'Liam Park', 'liam@maxtion.dev', '50 222 3344', '+971', 'CTO', '2025-08-20T14:25:32.056Z', '2025-08-20T14:25:32.056Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epp60006x5j772x67f1n', 'Company', 'Candor Ltd', 'Alice Tan', 'alice@candor.co', '50 333 7788', '+971', 'Manager', '2025-08-20T14:25:32.058Z', '2025-08-20T14:25:32.058Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epp80007x5j7cg06hguv', 'Company', 'Delta Co.', 'Jin Woo', 'jin@delta.co', '50 994 1100', '+971', 'Director', '2025-08-20T14:25:32.060Z', '2025-08-20T14:25:32.060Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eppb0008x5j77ih6thxo', 'Company', 'Echo GmbH', 'Lena Meyer', 'lena@echo.de', '160 111 2223', '+49', 'Manager', '2025-08-20T14:25:32.063Z', '2025-08-20T14:25:32.063Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eppf0009x5j7e9dri39g', 'Company', 'Foxtrot BV', 'Tariq Aziz', 'tariq@foxtrot.nl', '6 1234 5678', '+31', 'CEO', '2025-08-20T14:25:32.067Z', '2025-08-20T14:25:32.067Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eppl000ax5j7d4lmaj4t', 'Company', 'Gamma LLC', 'Sara Gomez', 'sara@gammallc.com', '415 555 1212', '+1', 'Manager', '2025-08-20T14:25:32.073Z', '2025-08-20T14:25:32.073Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eppp000bx5j7uhvd09j2', 'Company', 'Helios Pte', 'Mei Lin', 'mei@helios.sg', '8123 4567', '+65', 'Director', '2025-08-20T14:25:32.077Z', '2025-08-20T14:25:32.077Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eppt000cx5j7fjhn5al4', 'Company', 'Iris Studio', 'Rani Putri', 'rani@iris.studio', '812 3456 7890', '+62', 'Owner', '2025-08-20T14:25:32.082Z', '2025-08-20T14:25:32.082Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epq1000dx5j7zgduvsje', 'Company', 'Juno Sdn Bhd', 'Farid Shah', 'farid@juno.my', '12 345 6789', '+60', 'Manager', '2025-08-20T14:25:32.090Z', '2025-08-20T14:25:32.090Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epq5000ex5j7y84bi7fm', 'Company', 'Kappa Inc', 'Becky Lee', 'becky@kappa.com', '6123 4567', '+852', 'CEO', '2025-08-20T14:25:32.094Z', '2025-08-20T14:25:32.094Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epq9000fx5j7ijikz889', 'Company', 'Lumen Labs', 'Jorge Ruiz', 'jorge@lumenlabs.io', '655 111 222', '+34', 'CTO', '2025-08-20T14:25:32.097Z', '2025-08-20T14:25:32.097Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epqc000gx5j7ymd9ulaa', 'Company', 'Mango Corp', 'Dani So', 'dani@mango.com', '10 2345 6789', '+82', 'Manager', '2025-08-20T14:25:32.101Z', '2025-08-20T14:25:32.101Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epqh000hx5j73m1vp6z1', 'Company', 'Nexus Ltd', 'Ken Wong', 'ken@nexus.hk', '5123 9876', '+852', 'Director', '2025-08-20T14:25:32.105Z', '2025-08-20T14:25:32.105Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epqk000ix5j7lv4lfmhs', 'Company', 'Orion SA', 'Pierre Lac', 'pierre@orion.fr', '6 12 34 56 78', '+33', 'Manager', '2025-08-20T14:25:32.108Z', '2025-08-20T14:25:32.108Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epqo000jx5j7q5mal9cz', 'Company', 'Pluto LLP', 'Wira Adi', 'wira@pluto.com', '813 7777 1212', '+62', 'Owner', '2025-08-20T14:25:32.112Z', '2025-08-20T14:25:32.112Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epqs000kx5j749c8satb', 'Company', 'Quark AB', 'Anders B', 'anders@quark.se', '70 123 4567', '+46', 'CEO', '2025-08-20T14:25:32.116Z', '2025-08-20T14:25:32.116Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epqv000lx5j7m2b87iuh', 'Company', 'Radian BV', 'Ivo K', 'ivo@radian.eu', '6 8765 4321', '+31', 'Manager', '2025-08-20T14:25:32.119Z', '2025-08-20T14:25:32.119Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epqx000mx5j75demwzgn', 'Company', 'Sigma Oy', 'Tiina K', 'tiina@sigma.fi', '40 123 4567', '+358', 'Director', '2025-08-20T14:25:32.121Z', '2025-08-20T14:25:32.121Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epqz000nx5j79ts1ry45', 'Company', 'Titan Pty', 'Noah Reed', 'noah@titan.au', '412 345 678', '+61', 'Owner', '2025-08-20T14:25:32.124Z', '2025-08-20T14:25:32.124Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epr3000ox5j7dzcl7fat', 'Company', 'Umbra SAS', 'Luc Martin', 'luc@umbra.fr', '6 99 88 77 66', '+33', 'Manager', '2025-08-20T14:25:32.127Z', '2025-08-20T14:25:32.127Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epr9000px5j7eoo4ivy3', 'Company', 'Vega NV', 'Eva Jans', 'eva@vega.be', '470 12 34 56', '+32', 'CEO', '2025-08-20T14:25:32.133Z', '2025-08-20T14:25:32.133Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eprc000qx5j7czhvwz5s', 'Company', 'Wave GmbH', 'Jonas K', 'jonas@wave.de', '171 234 5678', '+49', 'CTO', '2025-08-20T14:25:32.136Z', '2025-08-20T14:25:32.136Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eprg000rx5j7l5zrqn58', 'Company', 'Xenon KK', 'Akira Mori', 'akira@xenon.co.jp', '90 1234 5678', '+81', 'Manager', '2025-08-20T14:25:32.140Z', '2025-08-20T14:25:32.140Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eprj000sx5j75kwkkrka', 'Individual', NULL, 'Holly Brown', 'holly@yonder.uk', '7700 900123', '+44', 'Customer', '2025-08-20T14:25:32.143Z', '2025-08-20T14:25:32.143Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epro000tx5j7i040423b', 'Individual', NULL, 'Owen Hale', 'owen@zephyr.co', '85 123 4567', '+353', 'Customer', '2025-08-20T14:25:32.149Z', '2025-08-20T14:25:32.149Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epru000ux5j7aevngrkt', 'Company', 'Artemis LLC', 'Mia Chen', 'mia@artemis.com', '650 555 9988', '+1', 'Manager', '2025-08-20T14:25:32.154Z', '2025-08-20T14:25:32.154Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eprx000vx5j72ezaz9qg', 'Company', 'Basil AG', 'Felix H', 'felix@basil.ch', '79 123 45 67', '+41', 'CEO', '2025-08-20T14:25:32.158Z', '2025-08-20T14:25:32.158Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eps1000wx5j7r1yeumnj', 'Company', 'Corex Inc.', 'Ravi Patel', 'ravi@corex.com', '408 555 4321', '+1', 'Director', '2025-08-20T14:25:32.161Z', '2025-08-20T14:25:32.161Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eps4000xx5j74mb673gp', 'Company', 'Dorian SpA', 'Marco Rossi', 'marco@dorian.it', '347 123 4567', '+39', 'Manager', '2025-08-20T14:25:32.164Z', '2025-08-20T14:25:32.164Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epwr001zx5j7zkdpllm8', 'Company', 'Horizon Press', 'Emma White', 'horizonpress@example.com', '123456789', '+971', 'Customer', '2025-08-20T14:25:32.331Z', '2025-08-20T14:25:32.331Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epx70024x5j7knkhgxeq', 'Company', 'Nova Prints', 'Liam Carter', 'novaprints@example.com', '123456789', '+971', 'Customer', '2025-08-20T14:25:32.347Z', '2025-08-20T14:25:32.347Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epxo0029x5j70l4yzcra', 'Company', 'Galaxy Media', 'Sophia Adams', 'galaxymedia@example.com', '123456789', '+971', 'Customer', '2025-08-20T14:25:32.364Z', '2025-08-20T14:25:32.364Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epy7002ex5j7vhvd4iag', 'Company', 'PrintX Solutions', 'David Thompson', 'printxsolutions@example.com', '123456789', '+971', 'Customer', '2025-08-20T14:25:32.383Z', '2025-08-20T14:25:32.383Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epym002jx5j720tijpkm', 'Company', 'Creative Hub', 'Olivia Martinez', 'creativehub@example.com', '123456789', '+971', 'Customer', '2025-08-20T14:25:32.398Z', '2025-08-20T14:25:32.398Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epz1002ox5j7r1giwxov', 'Company', 'Urban Prints', 'Noah Wilson', 'urbanprints@example.com', '123456789', '+971', 'Customer', '2025-08-20T14:25:32.413Z', '2025-08-20T14:25:32.413Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2epze002tx5j7zyudjxiy', 'Company', 'Pixel Studio', 'Isabella Taylor', 'pixelstudio@example.com', '123456789', '+971', 'Customer', '2025-08-20T14:25:32.426Z', '2025-08-20T14:25:32.426Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eq03002yx5j7qs86661g', 'Company', 'Bright Ideas Co.', 'James Anderson', 'brightideasco.@example.com', '123456789', '+971', 'Customer', '2025-08-20T14:25:32.452Z', '2025-08-20T14:25:32.452Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2eq0u0033x5j7eezs3wwm', 'Company', 'Visionary Prints', 'Mia Harris', 'visionaryprints@example.com', '123456789', '+971', 'Customer', '2025-08-20T14:25:32.478Z', '2025-08-20T14:25:32.478Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2pdkw0003x5xj6ystys5w', 'Individual', NULL, 'Alifka iqbal', 'alifka@gmail.com', '123445', '+971', NULL, '2025-08-20T14:33:49.568Z', '2025-08-20T14:33:49.568Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek2s51y0004x5xj2paziy4v', 'Individual', NULL, 'alifka iqbal', 'alifka@gmail.com', '123445', '+971', NULL, '2025-08-20T14:35:58.487Z', '2025-08-20T14:35:58.487Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek38mc7000bx5xj7m0r8vcw', 'Individual', NULL, 'Alifka iqbal', 'alifka@gmail.com', '123456', '+971', NULL, '2025-08-20T14:48:47.382Z', '2025-08-20T14:48:47.382Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek5125d0003x5l8ze3b5od7', 'Company', 'Eagan Inc.', 'John Smith', 'john.smith@eagan.com', '501234567', '+971', 'Marketing Manager', '2025-08-20T15:38:53.857Z', '2025-08-20T15:38:53.857Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek5125k0004x5l83v76sj65', 'Company', 'Tech Solutions Ltd.', 'Sarah Johnson', 'sarah.j@techsolutions.com', '559876543', '+971', 'Operations Director', '2025-08-20T15:38:53.864Z', '2025-08-20T15:38:53.864Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek5125p0005x5l8i0s1gibt', 'Company', 'Global Print Corp.', 'Michael Brown', 'michael.b@globalprint.com', '524567890', '+971', 'Procurement Manager', '2025-08-20T15:38:53.869Z', '2025-08-20T15:38:53.869Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek5125x0006x5l86n1s8o7z', 'Company', 'Creative Agency', 'Lisa Wilson', 'lisa.w@creativeagency.com', '543210987', '+971', 'Creative Director', '2025-08-20T15:38:53.877Z', '2025-08-20T15:38:53.877Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmek512620007x5l89redvsq3', 'Individual', NULL, 'David Lee', 'david.lee@gmail.com', '567890123', '+971', NULL, '2025-08-20T15:38:53.882Z', '2025-08-20T15:38:53.882Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmekcwp5f0000x5669b3o8juh', 'Company', 'ABCD', 'ABCD EFG', 'ABCD@office.com', '1111111', '+971', 'ABCD', '2025-08-20T19:19:27.314Z', '2025-08-20T19:19:27.314Z', NULL);
INSERT INTO "Client" ("id", "clientType", "companyName", "contactPerson", "email", "phone", "countryCode", "role", "createdAt", "updatedAt", "userId") VALUES ('cmekj5wmd0011xffl1gmkylyz', 'Company', 'ABC', 'ABC DEF', 'abc@gmail.com', '1111111', '+971', 'ABC', '2025-08-20T22:14:34.516Z', '2025-08-20T22:14:34.516Z', NULL);

-- Data for table: Paper
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380711_xmz1yzt1h', 'Premium Card Stock', '350', 'cmek2epwd001wx5j7q9qx49a5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380715_3pi8w4smb', 'Art Paper', '150', 'cmek2epyd002gx5j736tpmlo3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380715_f0lu79s95', 'Art Paper', '150', 'cmek2epyp002lx5j782u8z8rf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380716_1jtbhcqhl', 'Premium Card Stock', '350', 'cmek2eq0c0030x5j7nh64b7la', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380716_f0676zh8e', 'Premium Card Stock', '350', 'cmek2eq0z0035x5j78d2bh52a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380716_nuju4how6', 'Premium Card Stock', '350', 'cmekj5xca0013xfflnbl5ohpr', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380716_sxr2yxtcu', 'Premium Card Stock', '350', 'cmekilram0003xfflus48jf6p', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380716_3gxxj2hz3', 'Premium Card Stock', '350', 'cmek39ntx000jx5xjpk1lqq87', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380717_r9d23o3w7', 'Premium Card Stock', '350', 'cmek38mmv000dx5xj81sjd9pk', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380717_bry179159', 'Premium Card Stock', '350', 'cmek2epz5002qx5j701d8lfv6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380714_leyox8l8l', 'Art Paper', '150', 'cmek2epxt002bx5j7f82jxumw', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380713_9nbnwdoei', 'Coated Paper', '200', 'cmek2epww0021x5j703n82450', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875380714_7tc1cu1i2', 'Glossy Paper', '200', 'cmek2epxd0026x5j71rlvx9tw', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987044_wfrqyfwfy', 'Premium Card Stock', '350', 'cmek2epwd001wx5j7q9qx49a5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987045_l0rl6y3hs', 'Coated Paper', '200', 'cmek2epyd002gx5j736tpmlo3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987045_ec5b5g2m0', 'Art Paper', '150', 'cmek2epyp002lx5j782u8z8rf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987046_by5qwkxli', 'Premium Card Stock', '350', 'cmek2eq0c0030x5j7nh64b7la', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987046_xpzfhlydu', 'Premium Card Stock', '350', 'cmek2eq0z0035x5j78d2bh52a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987046_6e2d0e0fh', 'Premium Card Stock', '350', 'cmekj5xca0013xfflnbl5ohpr', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987046_6ia78ry6y', 'Premium Card Stock', '350', 'cmekilram0003xfflus48jf6p', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987046_b2a8n715q', 'Premium Card Stock', '350', 'cmek39ntx000jx5xjpk1lqq87', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987047_2fkwb2qtq', 'Premium Card Stock', '350', 'cmek38mmv000dx5xj81sjd9pk', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987047_5ckw71chs', 'Premium Card Stock', '350', 'cmek2epz5002qx5j701d8lfv6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987045_lwzqels06', 'Art Paper', '150', 'cmek2epxt002bx5j7f82jxumw', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987045_0e5lrwtfz', 'Coated Paper', '200', 'cmek2epww0021x5j703n82450', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO "Paper" ("id", "name", "gsm", "quoteId", "inputWidth", "inputHeight", "pricePerPacket", "pricePerSheet", "sheetsPerPacket", "recommendedSheets", "enteredSheets", "outputWidth", "outputHeight", "selectedColors") VALUES ('paper_1755875987045_1bxj8xixa', 'Glossy Paper', '200', 'cmek2epxd0026x5j71rlvx9tw', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Data for table: Quote
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek2epwd001wx5j7q9qx49a5', 'QT-2025-0718-001', '2025-07-18T00:00:00.000Z', 'Approved', 'cmek2epop0004x5j7m81cyrgz', 'cmekilpoq0000xffloxu9xcse', '2025-08-20T14:25:32.317Z', '2025-08-20T14:25:32.317Z', 'Business Card', 1000, '1', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Business Card', 'Digital', 5.5, 0, 1, 9, 0, 5.5, 9);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek2epww0021x5j703n82450', 'QT-2025-0718-002', '2025-07-18T00:00:00.000Z', 'Pending', 'cmek2epwr001zx5j7zkdpllm8', 'cmekilpoq0000xffloxu9xcse', '2025-08-20T14:25:32.336Z', '2025-08-20T14:25:32.336Z', 'Art Book', 250, '2', 'Offset', '{"front":"4 Colors (CMYK)","back":"4 Colors (CMYK)"}', 'Art Book', 'Offset', 29.7, 1, 1, 21, 1, 29.7, 21);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek2epxd0026x5j71rlvx9tw', 'QT-2025-0719-003', '2025-07-19T00:00:00.000Z', 'Rejected', 'cmek2epx70024x5j7knkhgxeq', 'cmekilpoq0000xffloxu9xcse', '2025-08-20T14:25:32.353Z', '2025-08-20T14:25:32.353Z', 'Poster A2', 300, '2', 'Offset', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Poster A2', 'Offset', 59.4, 0, 1, 42, 0, 59.4, 42);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek2epxt002bx5j7f82jxumw', 'QT-2025-0720-004', '2025-07-20T00:00:00.000Z', 'Approved', 'cmek2epxo0029x5j70l4yzcra', 'cmekilpoq0000xffloxu9xcse', '2025-08-20T14:25:32.369Z', '2025-08-20T14:25:32.369Z', 'Flyer A5', 2000, '2', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Flyer A5', 'Digital', 21, 0, 1, 14.8, 0, 21, 14.8);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek2epyd002gx5j736tpmlo3', 'QT-2025-0720-005', '2025-07-20T00:00:00.000Z', 'Approved', 'cmek2epy7002ex5j7vhvd4iag', 'cmekilpoq0000xffloxu9xcse', '2025-08-20T14:25:32.388Z', '2025-08-20T14:25:32.388Z', 'Magazine', 500, '2', 'Offset', '{"front":"4 Colors (CMYK)","back":"4 Colors (CMYK)"}', 'Magazine', 'Offset', 29.7, 0.5, 1, 21, 0.5, 29.7, 21);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek2epyp002lx5j782u8z8rf', 'QT-2025-0721-006', '2025-07-21T00:00:00.000Z', 'Pending', 'cmek2epym002jx5j720tijpkm', 'cmekilpoq0000xffloxu9xcse', '2025-08-20T14:25:32.401Z', '2025-08-20T14:25:32.401Z', 'Sticker Pack', 500, '1', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Sticker Pack', 'Digital', 5, 0, 1, 5, 0, 5, 5);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek2eq0c0030x5j7nh64b7la', 'QT-2025-0722-009', '2025-07-22T00:00:00.000Z', 'Approved', 'cmek2eq03002yx5j7qs86661g', 'cmekilpoq0000xffloxu9xcse', '2025-08-20T14:25:32.460Z', '2025-08-20T14:25:32.460Z', 'Menu Card', 700, '1', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Business Card', 'Digital', 5.5, 0, 1, 9, 0, 5.5, 9);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek2eq0z0035x5j78d2bh52a', 'QT-2025-0723-010', '2025-08-20T00:00:00.000Z', 'Approved', 'cmek2eq0u0033x5j7eezs3wwm', 'cmek2oic80002x5xjcvofcdxt', '2025-08-20T14:25:32.482Z', '2025-08-20T22:11:55.780Z', 'Business Card', 150, '1', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Business Card', 'Digital', 5.5, 0, 1, 9, 0, 5.5, 9);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmekj5xca0013xfflnbl5ohpr', 'QT-2025-0821-353', '2025-08-20T22:14:34.344Z', 'Pending', 'cmekj5wmd0011xffl1gmkylyz', 'cmekilpoq0000xffloxu9xcse', '2025-08-20T22:14:35.530Z', '2025-08-20T22:14:35.530Z', 'Business Card', 1000, '1', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Business Card', 'Digital', 5.5, 0, 1, 9, 0, 5.5, 9);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmekilram0003xfflus48jf6p', 'QT-2024-001', '2025-08-20T00:00:00.000Z', 'Approved', 'cmekilqus0001xfflrr98j2ym', 'cmekj0vxf0006xffl2xdoub1x', '2025-08-20T21:58:54.574Z', '2025-08-20T22:23:51.586Z', 'Business Cards', 1000, '1', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Business Card', 'Digital', 5.5, 0, 1, 9, 0, 5.5, 9);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek39ntx000jx5xjpk1lqq87', 'QT-2025-0820-796', '2025-08-20T15:01:25.687Z', 'Rejected', 'cmek38mc7000bx5xj7m0r8vcw', 'cmek2oic80002x5xjcvofcdxt', '2025-08-20T14:49:35.973Z', '2025-08-20T22:34:33.535Z', 'Business Card', 1000, '1', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Business Card', 'Digital', 5.5, 0, 1, 9, 0, 5.5, 9);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek38mmv000dx5xj81sjd9pk', 'QT-2025-0820-259', '2025-08-20T14:48:47.574Z', 'Approved', 'cmek38mc7000bx5xj7m0r8vcw', 'cmek2oic80002x5xjcvofcdxt', '2025-08-20T14:48:47.768Z', '2025-08-20T22:46:28.568Z', 'Business Card', 1000, '1', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Business Card', 'Digital', 5.5, 0, 1, 9, 0, 5.5, 9);
INSERT INTO "Quote" ("id", "quoteId", "date", "status", "clientId", "userId", "createdAt", "updatedAt", "product", "quantity", "sides", "printing", "colors", "productName", "printingSelection", "flatSizeHeight", "closeSizeSpine", "useSameAsFlat", "flatSizeWidth", "flatSizeSpine", "closeSizeHeight", "closeSizeWidth") VALUES ('cmek2epz5002qx5j701d8lfv6', 'QT-2025-0721-007', '2025-08-21T05:27:44.426Z', 'Approved', 'cmek2epz1002ox5j7r1giwxov', 'cmekj0vxf0006xffl2xdoub1x', '2025-08-20T14:25:32.417Z', '2025-08-21T07:44:09.048Z', 'Brochure', 50, '2', 'Digital', '{"front":"4 Colors (CMYK)","back":"1 Color"}', 'Brochure', 'Offset', 29.7, 0, 1, 21, 0, 29.7, 21);

