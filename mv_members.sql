-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 43.201.37.155
-- 생성 시간: 23-03-21 11:51
-- 서버 버전: 8.0.32-0ubuntu0.20.04.2
-- PHP 버전: 8.0.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- 데이터베이스: `testaccount`
--

-- --------------------------------------------------------

--
-- 테이블 구조 `mv_members`
--

CREATE TABLE `mv_members` (
  `id` bigint NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `user_pw` varchar(128) NOT NULL,
  `name` varchar(64) NOT NULL,
  `gender` tinyint NOT NULL DEFAULT '0',
  `email` varchar(128) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `registered_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- 덤프된 테이블의 인덱스
--

--
-- 테이블의 인덱스 `mv_members`
--
ALTER TABLE `mv_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `user_pw` (`user_pw`),
  ADD KEY `name` (`name`),
  ADD KEY `gender` (`gender`),
  ADD KEY `email` (`email`),
  ADD KEY `status` (`status`),
  ADD KEY `registered_date` (`registered_date`);

--
-- 덤프된 테이블의 AUTO_INCREMENT
--

--
-- 테이블의 AUTO_INCREMENT `mv_members`
--
ALTER TABLE `mv_members`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
COMMIT;
