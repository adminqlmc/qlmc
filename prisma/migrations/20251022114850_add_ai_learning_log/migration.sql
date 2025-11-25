-- CreateTable
CREATE TABLE `AILearningLog` (
    `id` VARCHAR(191) NOT NULL,
    `totalFeedback` INTEGER NOT NULL,
    `likeCount` INTEGER NOT NULL,
    `dislikeCount` INTEGER NOT NULL,
    `documentsUpdated` INTEGER NOT NULL,
    `topQuestions` TEXT NOT NULL,
    `improvements` TEXT NOT NULL,
    `learningDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AILearningLog_learningDate_idx`(`learningDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
