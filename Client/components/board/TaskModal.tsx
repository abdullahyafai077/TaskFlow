"use client";

import { FormEvent, useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { taskApi } from "@/lib/api";
import {
  PRIORITIES,
  STATUSES,
  type Priority,
  type Task,
  type TaskStatus,
  type User,
} from "@/lib/types";

export function TaskModal({
  open,
  onClose,
  projectId,
  members,
  task,
  onSaved,
  onDeleted,
  canDelete,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: User[];
  task: Task | null;
  onSaved: (task: Task) => void;
  onDeleted?: (id: string) => void;
  canDelete?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Todo");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [tags, setTags] = useState("");
  const [subtaskText, setSubtaskText] = useState("");
  const [subtasks, setSubtasks] = useState<{ title: string; done: boolean }[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(
        typeof task.assigneeId === "object" && task.assigneeId
          ? task.assigneeId._id
          : (task.assigneeId as string) || "",
      );
      setTags((task.tags || []).join(", "));
      setSubtasks(
        (task.subtasks || []).map((s) => ({ title: s.title, done: s.done })),
      );
    } else {
      setTitle("");
      setDescription("");
      setStatus("Todo");
      setPriority("Medium");
      setAssigneeId("");
      setTags("");
      setSubtasks([]);
    }
    setError("");
  }, [open, task]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: title.trim(),
      description,
      status,
      priority,
      assigneeId: assigneeId || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      subtasks,
    };
    try {
      if (task) {
        const { data } = await taskApi.update(task._id, payload);
        onSaved(data);
      } else {
        const { data } = await taskApi.create(projectId, payload);
        onSaved(data);
      }
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Save failed",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!task || !onDeleted) return;
    setSaving(true);
    try {
      await taskApi.remove(task._id);
      onDeleted(task._id);
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Delete failed",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={task ? "Edit task" : "New task"}
      className="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
        <Select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <div className="rounded-2xl bg-background/70 p-3 ring-1 ring-line">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
            Subtasks
          </p>
          <div className="space-y-1.5">
            {subtasks.map((s, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={(e) => {
                    const next = [...subtasks];
                    next[i] = { ...next[i], done: e.target.checked };
                    setSubtasks(next);
                  }}
                />
                <span className={s.done ? "text-muted line-through" : ""}>
                  {s.title}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="Add subtask"
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!subtaskText.trim()) return;
                setSubtasks([
                  ...subtasks,
                  { title: subtaskText.trim(), done: false },
                ]);
                setSubtaskText("");
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-2 pt-1">
          {task && canDelete ? (
            <Button
              type="button"
              variant="danger"
              disabled={saving}
              onClick={remove}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
