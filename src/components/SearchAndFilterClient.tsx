"use client";
import dynamic from "next/dynamic";

const SearchAndFilter = dynamic(() => import("./SearchAndFilter"), { ssr: false });

export default SearchAndFilter; 