package com.conviva.react.apptracker.util;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;

import java.util.ArrayList;
import java.util.List;

/**
 * Lightweight stub for ReadableArray used in unit tests.
 * Backed by a plain List so tests run without the React Native runtime.
 * Implemented: size(), isNull(), getBoolean(), getDouble(), getInt(),
 *              getString(), getArray(), getMap(), toArrayList().
 * Not implemented (throws UnsupportedOperationException): getDynamic(), getType().
 */
public class ReadableArrayStub implements ReadableArray {

    private final List<Object> data;

    public ReadableArrayStub(List<Object> data) {
        this.data = new ArrayList<>(data);
    }

    @Override
    public int size() {
        return data.size();
    }

    @Override
    public boolean isNull(int index) {
        return data.get(index) == null;
    }

    @Override
    public boolean getBoolean(int index) {
        return (Boolean) data.get(index);
    }

    @Override
    public double getDouble(int index) {
        return ((Number) data.get(index)).doubleValue();
    }

    @Override
    public int getInt(int index) {
        return ((Number) data.get(index)).intValue();
    }

    @Nullable
    @Override
    public String getString(int index) {
        return (String) data.get(index);
    }

    @Nullable
    @Override
    public ReadableArray getArray(int index) {
        return (ReadableArray) data.get(index);
    }

    @Nullable
    @Override
    public ReadableMap getMap(int index) {
        return (ReadableMap) data.get(index);
    }

    @NonNull
    @Override
    public Dynamic getDynamic(int index) {
        throw new UnsupportedOperationException("getDynamic not implemented in stub");
    }

    @NonNull
    @Override
    public ReadableType getType(int index) {
        throw new UnsupportedOperationException("getType not implemented in stub");
    }

    @NonNull
    @Override
    public ArrayList<Object> toArrayList() {
        return new ArrayList<>(data);
    }
}
