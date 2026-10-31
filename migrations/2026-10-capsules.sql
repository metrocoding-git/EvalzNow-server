-- Capsule (Capacity Accounting) tables – created automatically at API start (src/config/ensureDb.js).
-- Run manually only if AUTO table creation is not wanted. Safe to re-run (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS `capsules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clientId` int(11) NOT NULL,
  `capsuleName` varchar(150) NOT NULL,
  `capsuleId` varchar(60) NOT NULL,
  `capsuleStartDate` date DEFAULT NULL,
  `capsuleEndDate` date DEFAULT NULL,
  `capsuleDirector` varchar(150) DEFAULT NULL,
  `capsuleType` varchar(40) NOT NULL,
  `signatureProfile` varchar(80) DEFAULT NULL,
  `environment` varchar(80) DEFAULT NULL,
  `frameworkAge` varchar(40) DEFAULT NULL,
  `settings` longtext DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_capsule_client_code` (`clientId`,`capsuleId`),
  CONSTRAINT `capsules_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS `capsule_staff` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capsuleId` int(11) NOT NULL,
  `staffId` int(11) NOT NULL,
  `roleType` varchar(30) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `capsule_staff_capsule_id` (`capsuleId`),
  CONSTRAINT `capsule_staff_ibfk_1` FOREIGN KEY (`capsuleId`) REFERENCES `capsules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS `capsule_benchmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capsuleId` int(11) NOT NULL,
  `benchmarkId` varchar(20) DEFAULT NULL,
  `benchmarkType` varchar(80) DEFAULT NULL,
  `benchmarkRef` varchar(80) DEFAULT NULL,
  `benchmarkDescription` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `capsule_benchmarks_capsule_id` (`capsuleId`),
  CONSTRAINT `capsule_benchmarks_ibfk_1` FOREIGN KEY (`capsuleId`) REFERENCES `capsules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS `capsule_rosters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capsuleId` int(11) NOT NULL,
  `candidateId` int(11) NOT NULL,
  `capsuleOutcome` varchar(40) NOT NULL DEFAULT 'Ongoing',
  `ageRange` varchar(40) DEFAULT 'Unknown',
  `presentCount` int(11) NOT NULL DEFAULT 0,
  `excusedAbsences` int(11) NOT NULL DEFAULT 0,
  `unexcusedAbsences` int(11) NOT NULL DEFAULT 0,
  `excusedTardies` int(11) NOT NULL DEFAULT 0,
  `unexcusedTardies` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_capsule_roster` (`capsuleId`,`candidateId`),
  KEY `capsule_rosters_candidate_id` (`candidateId`),
  CONSTRAINT `capsule_rosters_ibfk_1` FOREIGN KEY (`capsuleId`) REFERENCES `capsules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `capsule_rosters_ibfk_2` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS `capsule_blocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capsuleId` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `manageType` varchar(20) NOT NULL,
  `ppId` int(11) NOT NULL,
  `periodType` varchar(60) DEFAULT NULL,
  `shortDescription` varchar(255) DEFAULT NULL,
  `delivery` varchar(120) DEFAULT NULL,
  `data` longtext DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_id` (`candidate_id`),
  KEY `capsule_blocks_capsule_id_candidate_id_pp_id` (`capsuleId`,`candidate_id`,`ppId`),
  CONSTRAINT `capsule_blocks_ibfk_1` FOREIGN KEY (`capsuleId`) REFERENCES `capsules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `capsule_blocks_ibfk_2` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS `capsule_scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capsuleId` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `blockId` int(11) NOT NULL,
  `ppId` int(11) NOT NULL,
  `capacity` varchar(80) NOT NULL,
  `criticalRefDate` date DEFAULT NULL,
  `durationDays` double DEFAULT NULL,
  `attainedScore` double DEFAULT NULL,
  `maxScore` double DEFAULT NULL,
  `data` longtext DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_id` (`candidate_id`),
  KEY `capsule_scores_capsule_id_candidate_id_pp_id_critical_ref_date` (`capsuleId`,`candidate_id`,`ppId`,`criticalRefDate`),
  KEY `capsule_scores_block_id` (`blockId`),
  CONSTRAINT `capsule_scores_ibfk_1` FOREIGN KEY (`capsuleId`) REFERENCES `capsules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `capsule_scores_ibfk_2` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `capsule_scores_ibfk_3` FOREIGN KEY (`blockId`) REFERENCES `capsule_blocks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS `capsule_marker_names` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capsuleId` int(11) NOT NULL,
  `markerIndex` int(11) NOT NULL,
  `name` varchar(30) NOT NULL DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_capsule_marker` (`capsuleId`,`markerIndex`),
  CONSTRAINT `capsule_marker_names_ibfk_1` FOREIGN KEY (`capsuleId`) REFERENCES `capsules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS `capsule_projections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capsuleId` int(11) NOT NULL,
  `candidateId` int(11) NOT NULL,
  `points` longtext DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidateId` (`candidateId`),
  KEY `capsule_projections_capsule_id_candidate_id` (`capsuleId`,`candidateId`),
  CONSTRAINT `capsule_projections_ibfk_1` FOREIGN KEY (`capsuleId`) REFERENCES `capsules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `capsule_projections_ibfk_2` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS `capsule_effectivity` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `capsuleId` int(11) NOT NULL,
  `candidateId` int(11) NOT NULL,
  `ppId` int(11) NOT NULL,
  `effectivityType` varchar(60) DEFAULT NULL,
  `effectivityGap` varchar(60) DEFAULT NULL,
  `effectivitySegment` varchar(60) DEFAULT NULL,
  `effectivityContext` varchar(60) DEFAULT NULL,
  `effectivityPurpose` varchar(60) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_capsule_effectivity` (`capsuleId`,`candidateId`,`ppId`),
  KEY `candidateId` (`candidateId`),
  CONSTRAINT `capsule_effectivity_ibfk_1` FOREIGN KEY (`capsuleId`) REFERENCES `capsules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `capsule_effectivity_ibfk_2` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

CREATE TABLE IF NOT EXISTS `capsule_aux_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kind` varchar(30) NOT NULL,
  `capsuleId` int(11) NOT NULL,
  `candidateId` int(11) DEFAULT NULL,
  `data` longtext DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidateId` (`candidateId`),
  KEY `capsule_aux_records_capsule_id_kind_candidate_id` (`capsuleId`,`kind`,`candidateId`),
  CONSTRAINT `capsule_aux_records_ibfk_1` FOREIGN KEY (`capsuleId`) REFERENCES `capsules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `capsule_aux_records_ibfk_2` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
;

