-- AlterTable
ALTER TABLE `supportrequest` ADD COLUMN `scheduledEndTime` DATETIME(3) NULL,
    ADD COLUMN `scheduledStartTime` DATETIME(3) NULL;
