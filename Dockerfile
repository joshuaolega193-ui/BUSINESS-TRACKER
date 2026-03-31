# Use the Python 3.13 image
FROM python:3.13

# Create a non-root user (Hugging Face requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set the working directory
WORKDIR $HOME/app

# Copy and install requirements
# (Make sure requirements.txt is in your backend folder)
COPY --chown=user backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of your code
COPY --chown=user . .

# Expose the Hugging Face default port
EXPOSE 7860

# Run migrations and start the server
# We use --bind 0.0.0.0:7860 because HF only opens this specific port
CMD python backend/manage.py migrate && \
    gunicorn backend.wsgi:application --bind 0.0.0.0:7860