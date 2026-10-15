package com.conviva.react.apptracker.util;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Lightweight stub for ReadableMap used in unit tests.
 * Backed by a plain HashMap so tests can populate it without the React Native runtime.
 * Only the methods used by ConfigUtil are implemented; others throw UnsupportedOperationException.
 */
public class ReadableMapStub implements ReadableMap {

    private final Map<String, Object> data;

    public ReadableMapStub(Map<String, Object> data) {
        this.data = new HashMap<>(data);
    }

    @Override
    public boolean hasKey(@NonNull String name) {
        return data.containsKey(name);
    }

    @Override
    public boolean isNull(@NonNull String name) {
        return data.get(name) == null;
    }

    @Override
    public boolean getBoolean(@NonNull String name) {
        Object val = data.get(name);
        if (val instanceof Boolean) return (Boolean) val;
        throw new ClassCastException("Expected Boolean for key: " + name);
    }

    @Override
    public double getDouble(@NonNull String name) {
        Object val = data.get(name);
        if (val instanceof Number) return ((Number) val).doubleValue();
        throw new ClassCastException("Expected Number for key: " + name);
    }

    @Override
    public int getInt(@NonNull String name) {
        Object val = data.get(name);
        if (val instanceof Number) return ((Number) val).intValue();
        throw new ClassCastException("Expected Number for key: " + name);
    }

    @Nullable
    @Override
    public String getString(@NonNull String name) {
        Object val = data.get(name);
        if (val == null || val instanceof String) return (String) val;
        throw new ClassCastException("Expected String for key: " + name);
    }

    @Nullable
    @Override
    public ReadableArray getArray(@NonNull String name) {
        Object val = data.get(name);
        if (val == null || val instanceof ReadableArray) return (ReadableArray) val;
        throw new ClassCastException("Expected ReadableArray for key: " + name);
    }

    @Nullable
    @Override
    public ReadableMap getMap(@NonNull String name) {
        Object val = data.get(name);
        if (val == null || val instanceof ReadableMap) return (ReadableMap) val;
        throw new ClassCastException("Expected ReadableMap for key: " + name);
    }

    @NonNull
    @Override
    public Dynamic getDynamic(@NonNull String name) {
        throw new UnsupportedOperationException("getDynamic not implemented in stub");
    }

    @NonNull
    @Override
    public ReadableType getType(@NonNull String name) {
        throw new UnsupportedOperationException("getType not implemented in stub");
    }

    @NonNull
    @Override
    public ReadableMapKeySetIterator keySetIterator() {
        Iterator<String> it = data.keySet().iterator();
        return new ReadableMapKeySetIterator() {
            @Override public boolean hasNextKey() { return it.hasNext(); }
            @Override public String nextKey() { return it.next(); }
        };
    }

    @NonNull
    @Override
    public Iterator<Map.Entry<String, Object>> getEntryIterator() {
        return data.entrySet().iterator();
    }

    @NonNull
    @Override
    public HashMap<String, Object> toHashMap() {
        return new HashMap<>(data);
    }
}
