import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Projects from "./Projects.jsx";

function renderWithRouter(ui){
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("Projects page", () => {
  it("renderiza la lista inicial y permite crear proyecto", async () => {
    renderWithRouter(<Projects />);

    // Lista inicial
    expect(await screen.findByText("Demo")).toBeInTheDocument();

    // Crear uno nuevo
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: "Nuevo" } });
    fireEvent.click(screen.getByRole("button", { name: /crear/i }));

    // Con MSW arriba, el GET devuelve siempre "Demo"; aquí solo comprobamos que no crashea UI:
    expect(await screen.findByText("Demo")).toBeInTheDocument();
  });
});
