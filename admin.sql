-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 26, 2026 at 07:31 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kolek_dashboard`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `adminID` varchar(10) NOT NULL,
  `adminName` varchar(100) NOT NULL,
  `phoneNumber` varchar(15) DEFAULT NULL,
  `emailAddress` varchar(100) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `security_questions` longtext DEFAULT NULL,
  `security_answers` longtext DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `twoFactorCode` varchar(6) DEFAULT NULL,
  `twoFactorCodeExpiry` datetime DEFAULT NULL,
  `twoFactorEmail` varchar(255) DEFAULT NULL,
  `twoFactorEnabled` tinyint(1) DEFAULT 1,
  `tempTwoFactorToken` varchar(255) DEFAULT NULL,
  `tempTwoFactorTokenExpiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`adminID`, `adminName`, `phoneNumber`, `emailAddress`, `gender`, `security_questions`, `security_answers`, `password`, `twoFactorCode`, `twoFactorCodeExpiry`, `twoFactorEmail`, `twoFactorEnabled`, `tempTwoFactorToken`, `tempTwoFactorTokenExpiry`) VALUES
('D-001', 'Alya Rizqina', '01334444444', 'freddrickkoay66@gmail.com', 'Man', '{\"q1\":{\"question\":\"What was the name of your first school?\"},\"q2\":{\"question\":\"What is your favorite teacher\'s name?\"},\"q3\":{\"question\":\"What is your dream job as a child?\"}}', '{\"q1\":\"Taylor\",\"q2\":\"Yishen\",\"q3\":\"Developer\"}', '$2a$12$QuHL9sbMw.Ex/xa5uM27UuIltxFA92HrL1HllBRvruf45vi9i2xKu', NULL, NULL, 'freddrickkoay66@gmail.com', 1, NULL, NULL),
('D-002', 'Daniel Haziq', '01234567', 'danielhaziq@kolek.com', 'Man', '{\"q1\":{\"question\":\"What was the name of your first school?\"},\"q2\":{\"question\":\"What is your favorite teacher\'s name?\"},\"q3\":{\"question\":\"What is your dream job as a child?\"}}', '{\"q1\":\"Taylor\",\"q2\":\"Yishen\",\"q3\":\"Programmer\"}', '$2a$12$Vx3ggJTcT3LBqhsVdGgubethcSfGG/H6XM6veBl6av4HfHat/oGRa', NULL, NULL, NULL, 1, NULL, NULL),
('D-003', 'Nur Fathia', '0145566778', 'nurfathia@kolek.com', 'Woman', NULL, NULL, '$2a$12$A/8Pvu4W2TK3iYOGWrIxVutS5Ruok3d56e.7O0U9iPV4k7GE/htwW', NULL, NULL, NULL, 1, NULL, NULL),
('D-004', 'Irfan Syakir', '0166677889', 'irfansyakir@kolek.com', 'Man', NULL, NULL, '$2a$12$WTAqHV4FB25YMG84fYzdJeVW7NoeAI8Y56l5zEAr/1YUFADxa5Cxa', NULL, NULL, NULL, 1, NULL, NULL),
('D-005', 'Lee Jia Yong', '0177788990', 'leejiayong@kolek.com', 'Woman', NULL, NULL, '$2a$12$2eiPifw4RQAE3P6iqXXXuOTmHun.kMbwNx5uo2Grb.QZeUSitsgty', NULL, NULL, NULL, 1, NULL, NULL),
('D-006', 'Wong Kai Lee', '0188899001', 'wongkailee@kolek.com', 'Man', NULL, NULL, '$2a$12$iRQYIh7bYgIWi7Xf.XPsd.2T/E6twC.ftYDEuEwj.uf74mgb1bg26', NULL, NULL, NULL, 1, NULL, NULL),
('D-007', 'Tan Mei Heng', '0199900112', 'tanmeiheng@kolek.com', 'Woman', NULL, NULL, '$2a$12$.cw9Nkicu3QbiwcESuFaseaGyYSP/8wV2C/mCXQNxcYX12ney4fFS', NULL, NULL, NULL, 1, NULL, NULL),
('D-008', 'Hakim Anwar', '0112233445', 'hakimanwar@kolek.com', 'Man', NULL, NULL, '$2a$12$Yq3u9WZjJjbAQU0uGBMYFueeiu7IzMm5vJ9jcdNWf/e0JynhEMDvq', NULL, NULL, NULL, 1, NULL, NULL),
('D-009', 'Siti Nabila', '0153344556', 'sitinabila@kolek.com', 'Woman', NULL, NULL, '$2a$12$rMEebIs1a9/h5dYpf5w1xeeQSOaYMxI6.aPSkGhrTCbove0TBLGDy', NULL, NULL, NULL, 1, NULL, NULL),
('D-010', 'Low Jian Hou', '0104455667', 'lowjianhou@kolek.com', 'Man', NULL, NULL, '$2a$12$2uPsZCpqhc1rAkyrVq6dluKQKdcbNpRyHW29OgZNg9CHHMYngi8GG', NULL, NULL, NULL, 1, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`adminID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
