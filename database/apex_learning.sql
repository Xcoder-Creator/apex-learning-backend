-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 05, 2026 at 12:22 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `apex_learning`
--

-- --------------------------------------------------------

--
-- Table structure for table `account_details`
--

CREATE TABLE `account_details` (
  `id` int(11) NOT NULL,
  `name` varchar(60) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `password` varchar(130) NOT NULL,
  `verification_status` varchar(30) DEFAULT NULL,
  `reg_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_image` varchar(115) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attached_files`
--

CREATE TABLE `attached_files` (
  `id` int(11) NOT NULL,
  `creators_user_id` int(11) DEFAULT NULL,
  `post_id` int(11) DEFAULT NULL,
  `class_code` varchar(20) DEFAULT NULL,
  `file_name` longtext DEFAULT NULL,
  `file_status` varchar(300) DEFAULT NULL,
  `file_post_type` varchar(300) DEFAULT NULL,
  `file_mimetype` varchar(300) DEFAULT NULL,
  `file_size` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classworks`
--

CREATE TABLE `classworks` (
  `id` int(11) NOT NULL,
  `class_code` varchar(20) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(500) DEFAULT NULL,
  `due_date` varchar(150) DEFAULT NULL,
  `due_time` varchar(90) DEFAULT NULL,
  `classwork_type` varchar(20) DEFAULT NULL,
  `q_a` longtext DEFAULT NULL,
  `date_created` varchar(150) DEFAULT NULL,
  `time_created` varchar(90) DEFAULT NULL,
  `instruction` varchar(350) DEFAULT NULL,
  `date_format` varchar(150) DEFAULT NULL,
  `points` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_posts`
--

CREATE TABLE `class_posts` (
  `post_id` int(11) NOT NULL,
  `creators_user_id` int(11) DEFAULT NULL,
  `class_code` varchar(20) DEFAULT NULL,
  `post_type` varchar(180) DEFAULT NULL,
  `post_creation_date` varchar(90) DEFAULT NULL,
  `post_data` longtext DEFAULT NULL,
  `edited` varchar(30) DEFAULT NULL,
  `assignment_status` varchar(230) DEFAULT NULL,
  `score_value` int(11) DEFAULT NULL,
  `post_point` int(11) DEFAULT NULL,
  `edited_date` varchar(90) DEFAULT NULL,
  `post_title` varchar(300) DEFAULT NULL,
  `post_due_date` varchar(90) DEFAULT NULL,
  `post_creation_time` varchar(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `created_classes`
--

CREATE TABLE `created_classes` (
  `id` int(11) NOT NULL,
  `creators_user_id` int(11) DEFAULT NULL,
  `class_code` varchar(20) DEFAULT NULL,
  `class_status` varchar(20) DEFAULT NULL,
  `class_background_img` varchar(300) DEFAULT NULL,
  `class_name` varchar(100) DEFAULT NULL,
  `class_subject` varchar(100) DEFAULT NULL,
  `class_room` varchar(100) DEFAULT NULL,
  `class_section` varchar(100) DEFAULT NULL,
  `profile_initials` varchar(5) DEFAULT NULL,
  `create_date_time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `joined_classes`
--

CREATE TABLE `joined_classes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `class_code` varchar(20) DEFAULT NULL,
  `reg_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `private_comments`
--

CREATE TABLE `private_comments` (
  `id` int(11) NOT NULL,
  `classwork_id` int(11) DEFAULT NULL,
  `creators_user_id` int(11) DEFAULT NULL,
  `class_code` varchar(15) DEFAULT NULL,
  `comment_data` varchar(380) DEFAULT NULL,
  `creation_date` varchar(190) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `public_comments`
--

CREATE TABLE `public_comments` (
  `id` int(11) NOT NULL,
  `post_id` int(11) DEFAULT NULL,
  `creators_user_id` int(11) DEFAULT NULL,
  `class_code` varchar(20) DEFAULT NULL,
  `comment_data` longtext DEFAULT NULL,
  `creation_date` varchar(190) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `token` varchar(300) DEFAULT NULL,
  `creation_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reset_code`
--

CREATE TABLE `reset_code` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `reset_code` varchar(30) DEFAULT NULL,
  `creation_date_time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_classwork_response`
--

CREATE TABLE `student_classwork_response` (
  `id` int(11) NOT NULL,
  `classwork_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `is_done` int(11) DEFAULT NULL,
  `attendance_value` int(11) DEFAULT NULL,
  `response` longtext DEFAULT NULL,
  `class_code` varchar(16) DEFAULT NULL,
  `score` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_feedback`
--

CREATE TABLE `user_feedback` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `feedback` varchar(315) DEFAULT NULL,
  `date_sent` varchar(190) DEFAULT NULL,
  `time_sent` varchar(90) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_report`
--

CREATE TABLE `user_report` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `report_option` int(11) DEFAULT NULL,
  `report_type` varchar(140) DEFAULT NULL,
  `date_submitted` varchar(190) DEFAULT NULL,
  `time_submitted` varchar(90) DEFAULT NULL,
  `post_id` int(11) DEFAULT NULL,
  `class_code` varchar(16) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_settings`
--

CREATE TABLE `user_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `allow_email_notif` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `verify_code`
--

CREATE TABLE `verify_code` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `verify_code` varchar(15) DEFAULT NULL,
  `creation_date_time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account_details`
--
ALTER TABLE `account_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attached_files`
--
ALTER TABLE `attached_files`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `classworks`
--
ALTER TABLE `classworks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `class_posts`
--
ALTER TABLE `class_posts`
  ADD PRIMARY KEY (`post_id`);

--
-- Indexes for table `created_classes`
--
ALTER TABLE `created_classes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `joined_classes`
--
ALTER TABLE `joined_classes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `private_comments`
--
ALTER TABLE `private_comments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `public_comments`
--
ALTER TABLE `public_comments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reset_code`
--
ALTER TABLE `reset_code`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `student_classwork_response`
--
ALTER TABLE `student_classwork_response`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_feedback`
--
ALTER TABLE `user_feedback`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_report`
--
ALTER TABLE `user_report`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `verify_code`
--
ALTER TABLE `verify_code`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account_details`
--
ALTER TABLE `account_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attached_files`
--
ALTER TABLE `attached_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `classworks`
--
ALTER TABLE `classworks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `class_posts`
--
ALTER TABLE `class_posts`
  MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `created_classes`
--
ALTER TABLE `created_classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `joined_classes`
--
ALTER TABLE `joined_classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `private_comments`
--
ALTER TABLE `private_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `public_comments`
--
ALTER TABLE `public_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reset_code`
--
ALTER TABLE `reset_code`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_classwork_response`
--
ALTER TABLE `student_classwork_response`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_feedback`
--
ALTER TABLE `user_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_report`
--
ALTER TABLE `user_report`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_settings`
--
ALTER TABLE `user_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `verify_code`
--
ALTER TABLE `verify_code`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
