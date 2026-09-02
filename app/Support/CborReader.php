<?php

namespace App\Support;

use RuntimeException;

class CborReader
{
    private int $offset = 0;

    public function __construct(private readonly string $data) {}

    public function read(): mixed
    {
        if ($this->offset >= strlen($this->data)) {
            throw new RuntimeException('Unexpected end of CBOR data.');
        }

        $byte = ord($this->data[$this->offset++]);
        $major = $byte >> 5;
        $additional = $byte & 0x1f;

        return match ($major) {
            0 => $this->readLength($additional),
            1 => -1 - $this->readLength($additional),
            2 => $this->readBytes($this->readLength($additional)),
            3 => $this->readText($this->readLength($additional)),
            4 => $this->readArray($this->readLength($additional)),
            5 => $this->readMap($this->readLength($additional)),
            default => throw new RuntimeException('Unsupported CBOR type.'),
        };
    }

    public function remaining(): string
    {
        return substr($this->data, $this->offset);
    }

    private function readLength(int $additional): int
    {
        if ($additional < 24) {
            return $additional;
        }

        $bytes = match ($additional) {
            24 => 1,
            25 => 2,
            26 => 4,
            27 => 8,
            default => throw new RuntimeException('Unsupported CBOR length.'),
        };

        $chunk = $this->readBytes($bytes);
        $value = 0;
        for ($i = 0; $i < $bytes; $i++) {
            $value = ($value << 8) + ord($chunk[$i]);
        }

        return $value;
    }

    private function readBytes(int $length): string
    {
        if ($length < 0 || $this->offset + $length > strlen($this->data)) {
            throw new RuntimeException('Invalid CBOR byte length.');
        }

        $value = substr($this->data, $this->offset, $length);
        $this->offset += $length;

        return $value;
    }

    private function readText(int $length): string
    {
        return $this->readBytes($length);
    }

    private function readArray(int $length): array
    {
        $items = [];
        for ($i = 0; $i < $length; $i++) {
            $items[] = $this->read();
        }

        return $items;
    }

    private function readMap(int $length): array
    {
        $items = [];
        for ($i = 0; $i < $length; $i++) {
            $items[$this->read()] = $this->read();
        }

        return $items;
    }
}
