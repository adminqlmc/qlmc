/*
  Warnings:

  - The values [in_use] on the enum `Projector_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `booking` ALTER COLUMN `purpose` DROP DEFAULT;

-- AlterTable
ALTER TABLE `projector` MODIFY `status` ENUM('available', 'maintenance', 'broken') NOT NULL DEFAULT 'available';
