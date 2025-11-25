/*
  Warnings:

  - You are about to drop the column `lastChecked` on the `projector` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `projector` table. All the data in the column will be lost.
  - You are about to drop the column `seri` on the `projector` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serialNumber]` on the table `Projector` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `purpose` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `building` to the `Projector` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseDate` to the `Projector` table without a default value. This is not possible if the table is not empty.
  - Added the required column `room` to the `Projector` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serialNumber` to the `Projector` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warrantyExpiry` to the `Projector` table without a default value. This is not possible if the table is not empty.
  - Made the column `model` on table `projector` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_projectorId_fkey`;

-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_userId_fkey`;

-- AlterTable: Add purpose column with default first
ALTER TABLE `booking` ADD COLUMN `purpose` VARCHAR(191) NOT NULL DEFAULT 'Chưa cập nhật';
-- Then add createdAt
ALTER TABLE `booking` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable: Step 1 - Add nullable columns first
ALTER TABLE `projector` 
    ADD COLUMN `serialNumber` VARCHAR(191) NULL,
    ADD COLUMN `room` VARCHAR(191) NULL,
    ADD COLUMN `building` VARCHAR(191) NULL,
    ADD COLUMN `purchaseDate` DATETIME(3) NULL,
    ADD COLUMN `warrantyExpiry` DATETIME(3) NULL,
    ADD COLUMN `timeUsed` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastMaintenanceDate` DATETIME(3) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Step 2 - Migrate existing data from old columns to new columns with unique serial numbers
SET @counter = 0;
UPDATE `projector` SET 
    `serialNumber` = COALESCE(`seri`, CONCAT('SN-', LPAD((@counter := @counter + 1), 5, '0'))),
    `room` = COALESCE(SUBSTRING_INDEX(`location`, '-', 1), 'Chưa xác định'),
    `building` = COALESCE(SUBSTRING_INDEX(`location`, '-', -1), 'Chưa xác định'),
    `purchaseDate` = COALESCE(DATE_SUB(NOW(), INTERVAL 1 YEAR), NOW()),
    `warrantyExpiry` = COALESCE(DATE_ADD(NOW(), INTERVAL 1 YEAR), DATE_ADD(NOW(), INTERVAL 1 YEAR))
WHERE `serialNumber` IS NULL;

-- Step 3 - Update model to not null if needed
UPDATE `projector` SET `model` = 'Unknown' WHERE `model` IS NULL;

-- Step 4 - Make required columns NOT NULL
ALTER TABLE `projector` 
    MODIFY `model` VARCHAR(191) NOT NULL,
    MODIFY `serialNumber` VARCHAR(191) NOT NULL,
    MODIFY `room` VARCHAR(191) NOT NULL,
    MODIFY `building` VARCHAR(191) NOT NULL,
    MODIFY `purchaseDate` DATETIME(3) NOT NULL,
    MODIFY `warrantyExpiry` DATETIME(3) NOT NULL;

-- Step 5 - Drop old columns
ALTER TABLE `projector` 
    DROP COLUMN `lastChecked`,
    DROP COLUMN `location`,
    DROP COLUMN `seri`;

-- CreateIndex
CREATE UNIQUE INDEX `Projector_serialNumber_key` ON `Projector`(`serialNumber`);

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_projectorId_fkey` FOREIGN KEY (`projectorId`) REFERENCES `Projector`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
