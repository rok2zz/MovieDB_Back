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
-- 테이블 구조 `movies`
--

CREATE TABLE `movies` (
  `id` bigint NOT NULL,
  `moviedb_id` bigint NOT NULL,
  `title` varchar(128) NOT NULL,
  `overview` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `poster_path` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'not exist',
  `tagline` tinytext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `release_date` datetime DEFAULT NULL,
  `genres` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '미정',
  `country` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '미정',
  `runtime` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- 덤프된 테이블의 인덱스
--

--
-- 테이블의 인덱스 `movies`
--
ALTER TABLE `movies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `title` (`title`),
  ADD KEY `release_date` (`release_date`),
  ADD KEY `country` (`country`),
  ADD KEY `genres` (`genres`),
  ADD KEY `release_date_2` (`release_date`),
  ADD KEY `runtime` (`runtime`),
  ADD KEY `moviedb_id` (`moviedb_id`);

--
-- 덤프된 테이블의 AUTO_INCREMENT
--

--
-- 테이블의 AUTO_INCREMENT `movies`
--
ALTER TABLE `movies`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;
COMMIT;
