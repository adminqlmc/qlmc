/*
  Warnings:

  - You are about to drop the `chatbotknowledge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `issue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `issue` DROP FOREIGN KEY `Issue_projectorId_fkey`;

-- DropForeignKey
ALTER TABLE `issue` DROP FOREIGN KEY `Issue_userId_fkey`;

-- DropTable
DROP TABLE `chatbotknowledge`;

-- DropTable
DROP TABLE `issue`;
